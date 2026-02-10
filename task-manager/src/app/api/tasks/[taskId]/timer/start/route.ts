import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/requireApiSession";
import { dbConnect } from "@/lib/db/mongoose";
import { TaskModel } from "@/lib/db/models";

export async function POST(
  _req: Request,
  ctx: {
    params: Promise<{ taskId: string }>;
  }
) {
  const auth = await requireApiSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;
  const { taskId } = await ctx.params;

  await dbConnect();
  const task = await TaskModel.findOne({ _id: taskId, companyId: session.companyId });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = session.userId;
  const now = new Date();

  // Auto-move from To Do to In Progress when starting timer
  if (task.status === "todo") {
    task.status = "in_progress";
  }

  const alreadyActive = task.activeUserIds.some((id) => id.toString() === userId);
  const wasIdle = task.activeUserIds.length === 0;

  if (!alreadyActive) {
    task.activeUserIds.push(userId);
  }

  // If task was idle before this start, begin a new active interval
  if (wasIdle) {
    task.lastStartAt = now;
  }

  await task.save();

  return NextResponse.json({
    task: {
      id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      status: task.status,
      order: task.order,
      assigneeUserIds: (task.assigneeUserIds || []).map((x) => x.toString()),
      accumulatedMs: task.accumulatedMs,
      activeUserIds: (task.activeUserIds || []).map((x) => x.toString()),
      lastStartAt: task.lastStartAt ? task.lastStartAt.toISOString() : null,
    },
  });
}

