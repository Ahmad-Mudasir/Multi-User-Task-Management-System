import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { env } from "@/env";

const SESSION_COOKIE = "tm_session";

export type SessionPayload = {
  userId: string;
  companyId: string;
  email: string;
  name: string;
};

function getKey() {
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

