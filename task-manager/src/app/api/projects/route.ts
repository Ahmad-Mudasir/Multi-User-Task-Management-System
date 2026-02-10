import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/requireApiSession";
import { dbConnect } from "@/lib/db/mongoose";
import { ProjectModel } from "@/lib/db/models";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(2).max(200),
});

export async function POST(req: Request) {
  const auth = await requireApiSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;
  const body = await req.json().catch(() => null);
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await dbConnect();
  const project = await ProjectModel.create({
    companyId: session.companyId,
    name: parsed.data.name.trim(),
    createdByUserId: session.userId,
  });

  return NextResponse.json({ projectId: project._id.toString() });
}

