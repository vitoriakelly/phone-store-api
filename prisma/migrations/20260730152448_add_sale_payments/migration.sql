-- CreateTable
CREATE TABLE "sale_payments" (
    "id" UUID NOT NULL,
    "saleId" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "installments" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_payments_saleId_idx" ON "sale_payments"("saleId");

-- CreateIndex
CREATE INDEX "sale_payments_method_idx" ON "sale_payments"("method");

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migra os pagamentos das vendas existentes
-- para a nova tabela de pagamentos.

INSERT INTO "sale_payments" (
  "id",
  "saleId",
  "method",
  "amount",
  "installments",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  sale."id",
  sale."paymentMethod",
  sale."salePrice",
  NULL,
  sale."createdAt",
  sale."updatedAt"
FROM "sales" AS sale
WHERE NOT EXISTS (
  SELECT 1
  FROM "sale_payments" AS payment
  WHERE payment."saleId" = sale."id"
);
