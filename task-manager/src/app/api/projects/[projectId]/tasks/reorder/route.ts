import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/lib/auth/requireApiSession";
import { dbConnect } from "@/lib/db/mongoose";
import { ProjectModel, TaskModel } from "@/lib/db/models";

const reorderSchema = z.object({
  status: z.enum(["todo", "in_progress", "done"]),
  orderedIds: z.array(z.string()),
});

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const auth = await requireApiSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;
  const { projectId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await dbConnect();
  const project = await ProjectModel.findOne({ _id: projectId, companyId: session.companyId }).lean();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { status, orderedIds } = parsed.data;

  await Promise.all(
    orderedIds.map((id, idx) =>
      TaskModel.updateOne(
        { _id: id, projectId, companyId: session.companyId },
        { $set: { status, order: idx } }
      )
    )
  );

  return NextResponse.json({ ok: true });
}

