import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { assertSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/db";
import { jsonError, readJson } from "@/lib/http";
import { firstZodMessage, normalizePrice, variantUpdateSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Cross-site request blocked.", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in required.", 401);
  if (user.role !== "ADMIN") return jsonError("Admin access required.", 403);

  const { id } = await context.params;
  if (!/^c[a-z0-9]{20,32}$/i.test(id)) {
    return jsonError("Variant not found.", 404);
  }

  const parsed = variantUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return jsonError(firstZodMessage(parsed.error), 400);
  }

  const price = normalizePrice(parsed.data.price);

  try {
    const variant = await prisma.productVariant.update({
      where: { id },
      data: {
        price,
        stock_quantity: parsed.data.stock_quantity,
      },
      select: {
        id: true,
        sku: true,
        price: true,
        stock_quantity: true,
      },
    });

    const response = NextResponse.json({
      id: variant.id,
      sku: variant.sku,
      price: variant.price.toFixed(2),
      stock_quantity: variant.stock_quantity,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return jsonError("Variant not found.", 404);
    }
    console.error(error instanceof Error ? error.name : "variant update failed");
    return jsonError("Request failed.", 500);
  }
}
