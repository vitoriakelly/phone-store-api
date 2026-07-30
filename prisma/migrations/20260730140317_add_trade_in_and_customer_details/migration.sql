/*
  Warnings:

  - A unique constraint covering the columns `[tradeInDeviceId]` on the table `sales` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "DeviceStatus" ADD VALUE 'PENDENTE_INFORMACOES';

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'TROCA_DISPOSITIVO';

-- AlterTable
ALTER TABLE "devices" ALTER COLUMN "color" DROP NOT NULL,
ALTER COLUMN "imei" DROP NOT NULL,
ALTER COLUMN "salePrice" DROP NOT NULL;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "customerAddressNumber" VARCHAR(30),
ADD COLUMN     "customerCity" VARCHAR(120),
ADD COLUMN     "customerNeighborhood" VARCHAR(120),
ADD COLUMN     "customerSocialNetwork" VARCHAR(160),
ADD COLUMN     "customerStreet" VARCHAR(180),
ADD COLUMN     "customerZipCode" VARCHAR(9),
ADD COLUMN     "tradeInDeviceId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "sales_tradeInDeviceId_key" ON "sales"("tradeInDeviceId");

-- CreateIndex
CREATE INDEX "sales_paymentMethod_idx" ON "sales"("paymentMethod");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_tradeInDeviceId_fkey" FOREIGN KEY ("tradeInDeviceId") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
