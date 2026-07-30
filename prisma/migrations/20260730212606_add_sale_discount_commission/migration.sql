-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "commissionAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "commissionType" "CommissionType",
ADD COLUMN     "commissionValue" DECIMAL(12,2),
ADD COLUMN     "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "grossSalePrice" DECIMAL(12,2);

-- CreateIndex
CREATE INDEX "sales_deviceCondition_idx" ON "sales"("deviceCondition");

-- CreateIndex
CREATE INDEX "sales_commissionType_idx" ON "sales"("commissionType");
