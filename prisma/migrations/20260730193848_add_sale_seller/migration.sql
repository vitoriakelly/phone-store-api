-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "sellerId" UUID,
ADD COLUMN     "sellerName" VARCHAR(160) NOT NULL DEFAULT 'Não informado';

-- CreateIndex
CREATE INDEX "sales_sellerId_idx" ON "sales"("sellerId");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
