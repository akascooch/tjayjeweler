import { assertSameOrigin } from "@/lib/csrf";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Cross-site request blocked.", 403);
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return jsonError("Google sign-in is not configured.", 501);
  }

  return jsonError("Google sign-in is not enabled yet.", 501);
}
