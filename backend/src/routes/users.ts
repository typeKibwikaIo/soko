import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, httpError, validateBody } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

export const usersRouter = Router();
export const addressesRouter = Router();

const userInclude = {
  roles: { include: { role: true } },
  buyerProfile: true,
  vendorProfile: true,
} as const;

// GET /api/users/profile
usersRouter.get(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: userInclude,
    });
    if (!user) throw httpError(404, 'User not found');
    res.json({
      user: {
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
      },
    });
  }),
);

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  avatarUrl: z.string().trim().min(1).max(2000).nullable().optional(),
});

// PUT /api/users/profile
usersRouter.put(
  '/profile',
  authenticate,
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof updateProfileSchema>;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      include: userInclude,
    });
    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        emailVerified: !!user.emailVerifiedAt,
        phoneVerified: !!user.phoneVerifiedAt,
        roles: user.roles.map((r) => r.role.name),
        buyerProfile: user.buyerProfile,
        vendorProfile: user.vendorProfile,
      },
    });
  }),
);

// ---------------------------------------------------------------------------
// Addresses — /api/addresses
// ---------------------------------------------------------------------------

const addressSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(30),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(120),
  region: z.string().trim().max(120).optional(),
  country: z.string().trim().min(1).max(120).default('DRC'),
  postalCode: z.string().trim().max(20).optional(),
  addressType: z.enum(['SHIPPING', 'BILLING']).default('SHIPPING'),
  isDefault: z.boolean().default(false),
});

// GET /api/addresses
addressesRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const addresses = await prisma.userAddress.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json({ addresses });
  }),
);

// POST /api/addresses
addressesRouter.post(
  '/',
  authenticate,
  validateBody(addressSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof addressSchema>;
    // Only one default per user — clear others in the same transaction.
    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId: req.user!.id, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.userAddress.create({ data: { ...data, userId: req.user!.id } });
    });
    res.status(201).json({ address });
  }),
);

// PUT /api/addresses/:id — ownership enforced via userId in the where clause.
addressesRouter.put(
  '/:id',
  authenticate,
  validateBody(addressSchema.partial()),
  asyncHandler(async (req, res) => {
    const data = req.body as Partial<z.infer<typeof addressSchema>>;
    const existing = await prisma.userAddress.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!existing) throw httpError(404, 'Address not found');

    const address = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.userAddress.updateMany({
          where: { userId: req.user!.id, isDefault: true, NOT: { id: existing.id } },
          data: { isDefault: false },
        });
      }
      return tx.userAddress.update({ where: { id: existing.id }, data });
    });
    res.json({ address });
  }),
);

// DELETE /api/addresses/:id
addressesRouter.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await prisma.userAddress.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (result.count === 0) throw httpError(404, 'Address not found');
    res.json({ ok: true });
  }),
);
