-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_verification_expires_at" TIMESTAMP(3),
ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "phone_otp_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phone_otp_expires_at" TIMESTAMP(3),
ADD COLUMN     "phone_otp_hash" TEXT,
ADD COLUMN     "phone_verified_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vendor_profiles" ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "id_document_back_url" TEXT,
ADD COLUMN     "id_document_front_url" TEXT,
ADD COLUMN     "id_number" TEXT,
ADD COLUMN     "verification_note" TEXT,
ADD COLUMN     "verification_submitted_at" TIMESTAMP(3);
