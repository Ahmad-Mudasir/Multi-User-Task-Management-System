import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  await clearSessionCookie();
  // Let the client decide where to navigate after logout.
  // Returning JSON here avoids differences between local dev
  // and Vercel when redirecting from a POST in an API route.
  return NextResponse.json({ ok: true });
}

