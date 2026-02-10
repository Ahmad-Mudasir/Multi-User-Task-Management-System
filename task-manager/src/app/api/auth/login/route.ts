import { NextResponse } from "next/server";

import { dbConnect } from "@/lib/db/mongoose";
import { UserModel } from "@/lib/db/models";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  await dbConnect();
  const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  await createSessionCookie({
    userId: user._id.toString(),
    companyId: user.companyId.toString(),
    email: user.email,
    name: user.name,
  });

  return NextResponse.json({ ok: true });
}

