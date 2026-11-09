-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "authority_code" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "ref_id" TEXT,
ADD COLUMN     "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "authority" TEXT,
    "amount_irt" DECIMAL(12,2) NOT NULL,
    "amount_rial" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "request_code" INTEGER,
    "verify_code" INTEGER,
    "ref_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentTransaction_order_id_idx" ON "PaymentTransaction"("order_id");

-- CreateIndex
CREATE INDEX "PaymentTransaction_authority_idx" ON "PaymentTransaction"("authority");

-- CreateIndex
CREATE UNIQUE INDEX "Order_authority_code_key" ON "Order"("authority_code");

-- CreateIndex
CREATE INDEX "Order_status_created_at_idx" ON "Order"("status", "created_at");

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
