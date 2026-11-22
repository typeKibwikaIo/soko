import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const p = new PrismaClient();
const u = await p.user.findUnique({ where: { email: 'awa@test.com' } });
console.log('EMAIL TOKEN:', u.emailVerificationToken);
await p.user.update({
  where: { id: u.id },
  data: {
    phoneOtpHash: crypto.createHash('sha256').update('123456').digest('hex'),
    phoneOtpExpiresAt: new Date(Date.now() + 600000),
    phoneOtpAttempts: 0,
  },
});
console.log('OTP SET to 123456');
await p.$disconnect();
