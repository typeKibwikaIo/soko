import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, httpError, validateBody } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

export const vendorsRouter = Router();

const verificationSchema = z.object({
  idNumber: z.string().trim().min(4, 'ID number is required').max(60),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  idDocumentUrl: z.string().trim().min(1, 'Upload a photo of your ID document'),
});

// POST /api/vendors/verification — user submits ID document → PENDING.
// Any authenticated user can verify their account; vendors get the badge too.
vendorsRouter.post(
  '/verification',
  authenticate,
  validateBody(verificationSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof verificationSchema>;

    const existing = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.id } });
    if (existing?.verificationStatus === 'VERIFIED') {
      throw httpError(400, 'Account is already verified');
    }

    const updated = await prisma.vendorProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        idNumber: data.idNumber,
        dateOfBirth: new Date(`${data.dateOfBirth}T00:00:00Z`),
        idDocumentFrontUrl: data.idDocumentUrl,
        verificationStatus: 'PENDING',
        verificationSubmittedAt: new Date(),
        verificationNote: null,
      },
      create: {
        userId: req.user!.id,
        idNumber: data.idNumber,
        dateOfBirth: new Date(`${data.dateOfBirth}T00:00:00Z`),
        idDocumentFrontUrl: data.idDocumentUrl,
        verificationStatus: 'PENDING',
        verificationSubmittedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'user.identity_verification_submitted',
        entityType: 'vendor_profile',
        entityId: updated.id,
      },
    });

    res.json({ vendorProfile: updated });
  }),
);
