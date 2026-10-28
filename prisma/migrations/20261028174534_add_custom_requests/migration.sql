-- CreateEnum
CREATE TYPE "CustomRequestKind" AS ENUM ('EXISTING_MODEL', 'ORIGINAL_DESIGN');

-- CreateEnum
CREATE TYPE "CustomRequestStatus" AS ENUM ('NEW', 'REVIEWED', 'CLOSED');

-- CreateTable
CREATE TABLE "CustomRequest" (
    "id" TEXT NOT NULL,
    "kind" "CustomRequestKind" NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_phone" TEXT NOT NULL,
    "reference_file" TEXT,
    "payload_hash" CHAR(64) NOT NULL,
    "idempotency_key" UUID NOT NULL,
    "status" "CustomRequestStatus" NOT NULL DEFAULT 'NEW',
    "staff_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomRequest_idempotency_key_key" ON "CustomRequest"("idempotency_key");

-- CreateIndex
CREATE INDEX "CustomRequest_status_created_at_idx" ON "CustomRequest"("status", "created_at");

-- CreateIndex
CREATE INDEX "CustomRequest_product_id_idx" ON "CustomRequest"("product_id");

-- AddForeignKey
ALTER TABLE "CustomRequest" ADD CONSTRAINT "CustomRequest_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
