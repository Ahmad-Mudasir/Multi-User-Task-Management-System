import { notFound } from "next/navigation";

import { requireSession } from "@/lib/auth/requireSession";
import { dbConnect } from "@/lib/db/mongoose";
import { ProjectModel, TaskModel, UserModel } from "@/lib/db/models";
import { ProjectBoard } from "@/components/projects/ProjectBoard";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireSession();
  const { projectId } = await params;

  await dbConnect();

  const [project, users, tasks] = await Promise.all([
    ProjectModel.findOne({ _id: projectId, companyId: session.companyId }).lean(),
    UserModel.find({ companyId: session.companyId }).sort({ name: 1 }).lean(),
    TaskModel.find({ projectId, companyId: session.companyId }).sort({ order: 1 }).lean(),
  ]);

  if (!project) return notFound();

  return (
    <ProjectBoard
      session={session}
      project={{
        id: project._id.toString(),
        name: project.name,
      }}
      users={users.map((u) => ({ id: u._id.toString(), name: u.name }))}
      initialTasks={tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description || "",
        status: t.status,
        order: t.order,
        assigneeUserIds: (t.assigneeUserIds || []).map((x) => x.toString()),
        accumulatedMs: t.accumulatedMs,
        activeUserIds: (t.activeUserIds || []).map((x) => x.toString()),
        lastStartAt: t.lastStartAt ? t.lastStartAt.toISOString() : null,
      }))}
    />
  );
}

