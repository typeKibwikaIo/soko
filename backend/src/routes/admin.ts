import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler, httpError, validateBody } from '../middleware/errorHandler';
import { authenticate, requireRole } from '../middleware/auth';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('ADMIN'));

const reviewSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  note: z.string().trim().max(500).optional(),
});

// PATCH /api/admin/vendors/:id — approve or reject a vendor's ID verification.
adminRouter.patch(
  '/vendors/:id',
  validateBody(reviewSchema),
  asyncHandler(async (req, res) => {
    const { status, note } = req.body as z.infer<typeof reviewSchema>;
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!vendor) throw httpError(404, 'Vendor profile not found');
    if (vendor.verificationStatus !== 'PENDING') {
      throw httpError(400, 'This vendor is not pending review');
    }

    const updated = await prisma.vendorProfile.update({
      where: { id: vendor.id },
      data: { verificationStatus: status, verificationNote: note ?? null },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: `vendor.verification_${status.toLowerCase()}`,
        entityType: 'vendor_profile',
        entityId: vendor.id,
        metadata: { vendorUserId: vendor.userId, note },
      },
    });

    res.json({ vendorProfile: updated });
  }),
);

// GET /api/admin/vendors/pending — list vendors awaiting review.
adminRouter.get(
  '/vendors/pending',
  asyncHandler(async (_req, res) => {
    const vendors = await prisma.vendorProfile.findMany({
      where: { verificationStatus: 'PENDING' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
      orderBy: { verificationSubmittedAt: 'asc' },
    });
    res.json({ vendors });
  }),
);
