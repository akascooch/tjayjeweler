-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_VERIFICATION';
ALTER TYPE "OrderStatus" ADD VALUE 'PAYMENT_APPROVED';
ALTER TYPE "OrderStatus" ADD VALUE 'PAYMENT_REJECTED';
ALTER TYPE "OrderStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "OrderStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "phone" TEXT,
ADD COLUMN "receipt_image" TEXT,
ADD COLUMN "staff_note" TEXT;

-- CreateTable
CREATE TABLE "StoreSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "bank_card_number" TEXT NOT NULL DEFAULT '',
    "bank_card_holder" TEXT NOT NULL DEFAULT '',
    "bank_name" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("id")
);

INSERT INTO "StoreSetting" ("id", "bank_card_number", "bank_card_holder", "bank_name", "updated_at")
VALUES (1, '', '', '', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
