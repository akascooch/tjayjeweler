export type ZarinpalRequestInput = {
  amountRial: number;
  description: string;
  callbackUrl: string;
  email?: string | null;
  mobile?: string | null;
  orderId: string;
};

export type ZarinpalRequestResult =
  | { ok: true; authority: string; paymentUrl: string; code: number }
  | { ok: false; code: number; message: string };

export type ZarinpalVerifyInput = {
  amountRial: number;
  authority: string;
};

export type ZarinpalVerifyResult =
  | { ok: true; code: number; refId: string; cardPan?: string }
  | { ok: false; code: number; message: string };

function sandboxEnabled() {
  const value = (process.env.ZARINPAL_SANDBOX ?? "true").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function zarinpalConfig() {
  const merchantId = (process.env.ZARINPAL_MERCHANT_ID ?? "").trim();
  const sandbox = sandboxEnabled();
  const apiBase = sandbox ? "https://sandbox.zarinpal.com/pg/v4/payment" : "https://payment.zarinpal.com/pg/v4/payment";
  const startPayBase = sandbox
    ? "https://sandbox.zarinpal.com/pg/StartPay"
    : "https://www.zarinpal.com/pg/StartPay";

  return { merchantId, sandbox, apiBase, startPayBase };
}

function messageFromData(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const errors = (data as { errors?: unknown }).errors;
  if (typeof errors === "string" && errors.trim()) return errors;
  if (errors && typeof errors === "object" && "message" in errors) {
    const message = (errors as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export async function zarinpalRequestPayment(input: ZarinpalRequestInput): Promise<ZarinpalRequestResult> {
  const { merchantId, apiBase, startPayBase } = zarinpalConfig();
  if (!merchantId) {
    return { ok: false, code: -1, message: "Payment gateway is not configured." };
  }
  if (!Number.isInteger(input.amountRial) || input.amountRial < 1000) {
    return { ok: false, code: -2, message: "Order total is below the payment minimum." };
  }

  const response = await fetch(`${apiBase}/request.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount: input.amountRial,
      description: input.description.slice(0, 255),
      callback_url: input.callbackUrl,
      metadata: {
        order_id: input.orderId,
        email: input.email ?? undefined,
        mobile: input.mobile ?? undefined,
      },
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as {
    data?: { code?: number; authority?: string; message?: string };
    errors?: unknown;
  } | null;

  const code = payload?.data?.code ?? 0;
  const authority = payload?.data?.authority;
  if (code === 100 && typeof authority === "string" && authority.length > 0) {
    return {
      ok: true,
      authority,
      paymentUrl: `${startPayBase}/${authority}`,
      code,
    };
  }

  return {
    ok: false,
    code,
    message: messageFromData(payload, payload?.data?.message ?? "Payment request failed."),
  };
}

export async function zarinpalVerifyPayment(input: ZarinpalVerifyInput): Promise<ZarinpalVerifyResult> {
  const { merchantId, apiBase } = zarinpalConfig();
  if (!merchantId) {
    return { ok: false, code: -1, message: "Payment gateway is not configured." };
  }

  const response = await fetch(`${apiBase}/verify.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount: input.amountRial,
      authority: input.authority,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as {
    data?: { code?: number; ref_id?: number | string; card_pan?: string; message?: string };
    errors?: unknown;
  } | null;

  const code = payload?.data?.code ?? 0;
  const refId = payload?.data?.ref_id;
  if ((code === 100 || code === 101) && refId != null && String(refId).length > 0) {
    return {
      ok: true,
      code,
      refId: String(refId),
      cardPan: typeof payload?.data?.card_pan === "string" ? payload.data.card_pan : undefined,
    };
  }

  return {
    ok: false,
    code,
    message: messageFromData(payload, payload?.data?.message ?? "Payment verification failed."),
  };
}

export function isSuccessfulVerifyCode(code: number) {
  return code === 100 || code === 101;
}
