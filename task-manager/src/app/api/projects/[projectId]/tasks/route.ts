import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiSession } from "@/lib/auth/requireApiSession";
import { dbConnect } from "@/lib/db/mongoose";
import { ProjectModel, TaskModel } from "@/lib/db/models";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
});

export async function GET(_req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const auth = await requireApiSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;
  const { projectId } = await ctx.params;

  await dbConnect();
  const project = await ProjectModel.findOne({ _id: projectId, companyId: session.companyId }).lean();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tasks = await TaskModel.find({ projectId, companyId: session.companyId }).sort({ order: 1 }).lean();
  return NextResponse.json({
    tasks: tasks.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description || "",
      status: t.status,
      order: t.order,
      assigneeUserIds: (t.assigneeUserIds || []).map((x) => x.toString()),
      accumulatedMs: t.accumulatedMs,
      activeUserIds: (t.activeUserIds || []).map((x) => x.toString()),
      lastStartAt: t.lastStartAt ? t.lastStartAt.toISOString() : null,
    })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const auth = await requireApiSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { session } = auth;
  const { projectId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await dbConnect();
  const project = await ProjectModel.findOne({ _id: projectId, companyId: session.companyId }).lean();
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const maxOrderTask = await TaskModel.findOne({
    projectId,
    companyId: session.companyId,
    status: "todo",
  })
    .sort({ order: -1 })
    .lean();

  const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

  const task = await TaskModel.create({
    companyId: session.companyId,
    projectId,
    title: parsed.data.title.trim(),
    status: "todo",
    order,
    description: "",
    assigneeUserIds: [],
    accumulatedMs: 0,
    activeUserIds: [],
    lastStartAt: null,
  });

  return NextResponse.json({
    task: {
      id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      status: task.status,
      order: task.order,
      assigneeUserIds: [],
      accumulatedMs: task.accumulatedMs,
      activeUserIds: [],
      lastStartAt: null,
    },
  });
}

