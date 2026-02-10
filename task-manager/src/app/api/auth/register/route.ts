import { NextResponse } from "next/server";

import { dbConnect } from "@/lib/db/mongoose";
import { CompanyModel, UserModel } from "@/lib/db/models";
import { hashPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, password, companyName } = parsed.data;

  await dbConnect();

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const normalizedCompanyName = companyName.trim();

  // Find an existing company by name (case-insensitive) so that users
  // who type the same company name end up in the same shared workspace.
  const existingCompany = await CompanyModel.findOne({
    name: { $regex: new RegExp(`^${normalizedCompanyName}$`, "i") },
  });

  const company =
    existingCompany ??
    (await CompanyModel.create({
      name: normalizedCompanyName,
    }));
  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({
    companyId: company._id,
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash,
  });

  await createSessionCookie({
    userId: user._id.toString(),
    companyId: company._id.toString(),
    email: user.email,
    name: user.name,
  });

  return NextResponse.json({ ok: true });
}

