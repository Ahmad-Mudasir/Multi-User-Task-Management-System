import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/lib/auth/requireApiSession";
import { dbConnect } from "@/lib/db/mongoose";
import { TaskModel } from "@/lib/db/models";

const updateSchema = z.object({
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

export async function PATCH(
  req: Request,
  ctx: {
    params: Promise<{ taskId: string }>;
  }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { taskId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await dbConnect();
  const task = await TaskModel.findOne({ _id: taskId, companyId: auth.session.companyId });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.status) {
    task.status = parsed.data.status;
  }

  await task.save();
  return NextResponse.json({ ok: true });
}

