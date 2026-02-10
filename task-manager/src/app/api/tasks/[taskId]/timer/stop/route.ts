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

  const beforeCount = task.activeUserIds.length;
  // Remove user from active set
  task.activeUserIds = task.activeUserIds.filter((id) => id.toString() !== userId);
  const afterCount = task.activeUserIds.length;

  const wasLastWorker = beforeCount > 0 && afterCount === 0;

  // Only when the last active user stops do we close the interval and accumulate time.
  if (wasLastWorker && task.lastStartAt) {
    const elapsed = now.getTime() - task.lastStartAt.getTime();
    if (elapsed > 0) {
      task.accumulatedMs += elapsed;
    }
    task.lastStartAt = null;
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

