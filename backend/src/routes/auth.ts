import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import {
  hashToken,
  refreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../lib/tokens';
import { asyncHandler, httpError, validateBody } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { strongPassword } from '../lib/password';
import { sendOtpSms, sendVerificationEmail } from '../lib/notify';
import type { RoleName, User } from '@prisma/client';

export const authRouter = Router();

const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional(),
  password: strongPassword,
  role: z.enum(['BUYER', 'VENDOR']).default('BUYER'),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });
const logoutSchema = z.object({ refreshToken: z.string().min(1) });
const phoneOtpSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code') });

const userInclude = {
  roles: { include: { role: true } },
  buyerProfile: true,
  vendorProfile: true,
} as const;

function publicUser(user: User & { roles: { role: { name: RoleName } }[]; buyerProfile: unknown; vendorProfile: unknown }) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    emailVerified: !!user.emailVerifiedAt,
    phoneVerified: !!user.phoneVerifiedAt,
    status: user.status,
    roles: user.roles.map((r) => r.role.name),
    buyerProfile: user.buyerProfile,
    vendorProfile: user.vendorProfile,
    createdAt: user.createdAt,
  };
}

async function issueTokens(userId: string, roles: string[]) {
  const accessToken = signAccessToken(userId, roles);
  const refreshToken = signRefreshToken(userId, crypto.randomUUID());
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiry(),
    },
  });
  return { accessToken, refreshToken };
}

// POST /api/auth/register
// Creates user + role + profile in ONE transaction. Role comes from the client
// but is validated against the enum — never trusted blindly.
authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, password, role } = req.body as z.infer<typeof registerSchema>;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw httpError(409, 'An account with this email already exists');

    const passwordHash = await bcrypt.hash(password, 12);
    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.$transaction(async (tx) => {
      const roleRow = await tx.role.upsert({
        where: { name: role },
        update: {},
        create: { name: role },
      });

      const created = await tx.user.create({
        data: {
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone || null,
          passwordHash,
          emailVerificationToken: emailToken,
          emailVerificationExpiresAt: emailTokenExpiry,
          roles: { create: { roleId: roleRow.id } },
          ...(role === 'VENDOR'
            ? { vendorProfile: { create: {} } }
            : { buyerProfile: { create: {} } }),
        },
        include: userInclude,
      });

      await tx.activityLog.create({
        data: { userId: created.id, action: 'user.registered', entityType: 'user', entityId: created.id },
      });

      return created;
    });

    const roles = user.roles.map((r) => r.role.name);
    const tokens = await issueTokens(user.id, roles);

    const verifyLink = `${process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`}/api/auth/verify-email?token=${emailToken}`;
    sendVerificationEmail(normalizedEmail, verifyLink).catch((e) =>
      console.error('Failed to send verification email:', e),
    );

    res.status(201).json({ user: publicUser(user), ...tokens });
  }),
);

// GET /api/auth/verify-email?token=... — clicked from the verification email.
authRouter.get(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const token = String(req.query.token ?? '');
    if (!token) throw httpError(400, 'Missing verification token');

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: { gt: new Date() },
        emailVerifiedAt: null,
      },
    });
    if (!user) throw httpError(400, 'Verification link is invalid or has expired');

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date(), emailVerificationToken: null, emailVerificationExpiresAt: null },
    });
    await prisma.activityLog.create({
      data: { userId: user.id, action: 'user.email_verified', entityType: 'user', entityId: user.id },
    });

    res.type('html').send(`<!doctype html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
      <h2>Email verified</h2><p>Your Soko account is verified. You can close this page.</p></body></html>`);
  }),
);

// POST /api/auth/resend-verification — authenticated; issues a fresh token.
authRouter.post(
  '/resend-verification',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw httpError(404, 'User not found');
    if (user.emailVerifiedAt) throw httpError(400, 'Email is already verified');

    const emailToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: emailToken,
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const verifyLink = `${process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`}/api/auth/verify-email?token=${emailToken}`;
    sendVerificationEmail(user.email, verifyLink).catch((e) =>
      console.error('Failed to send verification email:', e),
    );
    res.json({ ok: true });
  }),
);

// POST /api/auth/phone/request-otp — sends a 6-digit code to the user's phone.
authRouter.post(
  '/phone/request-otp',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw httpError(404, 'User not found');
    if (!user.phone) throw httpError(400, 'Add a phone number to your profile first');
    if (user.phoneVerifiedAt) throw httpError(400, 'Phone number is already verified');

    const code = crypto.randomInt(100000, 999999).toString();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneOtpHash: hashToken(code),
        phoneOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        phoneOtpAttempts: 0,
      },
    });
    sendOtpSms(user.phone, code).catch((e) => console.error('Failed to send OTP SMS:', e));
    res.json({ ok: true });
  }),
);

// POST /api/auth/phone/verify — checks the OTP and marks the phone verified.
authRouter.post(
  '/phone/verify',
  authenticate,
  validateBody(phoneOtpSchema),
  asyncHandler(async (req, res) => {
    const { code } = req.body as z.infer<typeof phoneOtpSchema>;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.phoneOtpHash || !user.phoneOtpExpiresAt) {
      throw httpError(400, 'Request a verification code first');
    }
    if (user.phoneOtpExpiresAt < new Date() || user.phoneOtpAttempts >= 5) {
      throw httpError(400, 'Code expired — request a new one');
    }
    if (hashToken(code) !== user.phoneOtpHash) {
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneOtpAttempts: { increment: 1 } },
      });
      throw httpError(400, 'Incorrect code');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerifiedAt: new Date(),
        phoneOtpHash: null,
        phoneOtpExpiresAt: null,
        phoneOtpAttempts: 0,
      },
    });
    await prisma.activityLog.create({
      data: { userId: user.id, action: 'user.phone_verified', entityType: 'user', entityId: user.id },
    });
    res.json({ ok: true });
  }),
);

// POST /api/auth/login
authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: userInclude,
    });

    // Same message for unknown email and wrong password — no user enumeration.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw httpError(401, 'Incorrect email or password');
    }
    if (user.status !== 'ACTIVE') {
      throw httpError(403, 'This account is not active');
    }

    const roles = user.roles.map((r) => r.role.name);
    const tokens = await issueTokens(user.id, roles);
    res.json({ user: publicUser(user), ...tokens });
  }),
);

// POST /api/auth/refresh — rotates the refresh token (old one is revoked).
authRouter.post(
  '/refresh',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw httpError(401, 'Invalid or expired refresh token');
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: { include: userInclude } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.userId !== payload.sub) {
      throw httpError(401, 'Refresh token is no longer valid');
    }
    if (stored.user.status !== 'ACTIVE') {
      throw httpError(403, 'This account is not active');
    }

    // Rotate: revoke old, issue new pair.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const roles = stored.user.roles.map((r) => r.role.name);
    const tokens = await issueTokens(stored.userId, roles);
    res.json({ user: publicUser(stored.user), ...tokens });
  }),
);

// POST /api/auth/logout — revokes the presented refresh token.
authRouter.post(
  '/logout',
  validateBody(logoutSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof logoutSchema>;
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.json({ ok: true });
  }),
);

// GET /api/auth/me — current user with roles and profiles.
authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: userInclude,
    });
    if (!user) throw httpError(404, 'User not found');
    res.json({ user: publicUser(user) });
  }),
);
