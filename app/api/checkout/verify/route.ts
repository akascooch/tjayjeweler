import { NextResponse } from "next/server";
import { verifyCheckoutPayment } from "@/lib/checkout";
import { allowAttempt } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/csrf";

export const runtime = "nodejs";

function resultUrl(request: Request, params: Record<string, string>) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const configured = (process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "");
  const base = configured || (host ? `${proto}://${host}` : "https://tjayjeweler.com");
  const url = new URL("/checkout/result", base);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authority = (url.searchParams.get("Authority") ?? url.searchParams.get("authority") ?? "").trim();
  const status = url.searchParams.get("Status") ?? url.searchParams.get("status");

  if (!authority) {
    return NextResponse.redirect(resultUrl(request, { status: "invalid", message: "Missing payment authority." }));
  }

  if (!allowAttempt(`checkout-verify:${clientAddress(request)}:${authority}`, 10, 60 * 60 * 1000)) {
    return NextResponse.redirect(resultUrl(request, { status: "rate_limited", message: "Too many verification attempts." }));
  }

  try {
    const result = await verifyCheckoutPayment(authority, status);
    if (result.ok) {
      return NextResponse.redirect(
        resultUrl(request, {
          status: "paid",
          orderId: result.orderId,
          refId: result.refId ?? "",
          amount: String(result.amountIrt),
        }),
      );
    }

    return NextResponse.redirect(
      resultUrl(request, {
        status: result.status,
        orderId: "orderId" in result && result.orderId ? result.orderId : "",
        message: result.message,
      }),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.name : "checkout verify failed");
    return NextResponse.redirect(resultUrl(request, { status: "error", message: "Verification failed." }));
  }
}
