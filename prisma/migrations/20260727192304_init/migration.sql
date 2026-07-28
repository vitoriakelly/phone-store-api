-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('DISPONIVEL', 'RESERVADO', 'VENDIDO');

-- CreateEnum
CREATE TYPE "DeviceCondition" AS ENUM ('NOVO', 'SEMINOVO', 'USADO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA', 'OUTRO');

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "brand" VARCHAR(80) NOT NULL,
    "model" VARCHAR(120) NOT NULL,
    "storage" VARCHAR(30) NOT NULL,
    "color" VARCHAR(50) NOT NULL,
    "imei" VARCHAR(15) NOT NULL,
    "batteryHealth" INTEGER,
    "condition" "DeviceCondition" NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "supplier" VARCHAR(160),
    "entryDate" DATE NOT NULL,
    "status" "DeviceStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "deviceId" UUID NOT NULL,
    "deviceBrand" VARCHAR(80) NOT NULL,
    "deviceModel" VARCHAR(120) NOT NULL,
    "deviceImei" VARCHAR(15) NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "customerName" VARCHAR(160) NOT NULL,
    "customerPhone" VARCHAR(30),
    "paymentMethod" "PaymentMethod" NOT NULL,
    "soldAt" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_imei_key" ON "devices"("imei");

-- CreateIndex
CREATE INDEX "devices_status_idx" ON "devices"("status");

-- CreateIndex
CREATE INDEX "devices_entryDate_idx" ON "devices"("entryDate");

-- CreateIndex
CREATE UNIQUE INDEX "sales_deviceId_key" ON "sales"("deviceId");

-- CreateIndex
CREATE INDEX "sales_soldAt_idx" ON "sales"("soldAt");

-- CreateIndex
CREATE INDEX "sales_customerName_idx" ON "sales"("customerName");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
