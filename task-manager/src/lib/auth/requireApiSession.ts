import { getSession } from "@/lib/auth/session";

export async function requireApiSession() {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" as const };
  }
  return { ok: true as const, session };
}

