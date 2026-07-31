-- CreateEnum
CREATE TYPE "CommissionPaymentStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "commissionPaidAt" TIMESTAMP(3),
ADD COLUMN     "commissionPaymentStatus" "CommissionPaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "sales_commissionPaymentStatus_idx" ON "sales"("commissionPaymentStatus");
