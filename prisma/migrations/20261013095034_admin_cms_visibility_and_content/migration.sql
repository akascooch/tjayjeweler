-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "is_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_price" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "alt_text" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "show_price_override" BOOLEAN;

-- CreateIndex
CREATE INDEX "Product_is_visible_status_idx" ON "Product"("is_visible", "status");
