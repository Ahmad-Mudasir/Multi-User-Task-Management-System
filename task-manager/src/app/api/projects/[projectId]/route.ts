import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/requireApiSession";
import { dbConnect } from "@/lib/db/mongoose";
import { ProjectModel, TaskModel } from "@/lib/db/models";

export async function DELETE(
  _req: Request,
  ctx: {
    params: Promise<{ projectId: string }>;
  }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;
  const { projectId } = await ctx.params;

  await dbConnect();

  const project = await ProjectModel.findOne({ _id: projectId, companyId: session.companyId });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await Promise.all([
    TaskModel.deleteMany({ projectId, companyId: session.companyId }),
    ProjectModel.deleteOne({ _id: projectId }),
  ]);

  return NextResponse.json({ ok: true });
}

