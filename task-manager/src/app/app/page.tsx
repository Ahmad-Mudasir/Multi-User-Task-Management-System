import Link from "next/link";

import { requireSession } from "@/lib/auth/requireSession";
import { dbConnect } from "@/lib/db/mongoose";
import { ProjectModel, UserModel } from "@/lib/db/models";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectButton } from "@/components/projects/NewProjectButton";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function AppHomePage() {
  const session = await requireSession();
  await dbConnect();

  const [users, projects] = await Promise.all([
    UserModel.find({ companyId: session.companyId }).sort({ name: 1 }).lean(),
    ProjectModel.find({ companyId: session.companyId }).sort({ createdAt: -1 }).lean(),
  ]);

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 rounded-3xl bg-white/70 p-5 shadow-sm shadow-slate-200 md:flex md:flex-col">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-400/60">
            TF
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">TaskFlow</div>
            <div className="text-xs text-slate-500">{session.email}</div>
          </div>
        </div>

        <nav className="space-y-1 text-sm">
          <div className="rounded-xl bg-indigo-50 px-3 py-2 font-medium text-indigo-600">
            Overview
          </div>
          <button className="mt-1 w-full cursor-pointer rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-slate-50">
            Projects
          </button>
          <button className="w-full cursor-pointer rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-slate-50">
            Settings
          </button>
        </nav>

        <div className="mt-auto pt-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 rounded-3xl bg-white/80 p-6 shadow-md shadow-slate-200">
        {/* Banner */}
        <section className="mb-6 overflow-hidden rounded-2xl bg-linear-to-r from-indigo-500 via-sky-500 to-cyan-400 p-5 text-white shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100/90">
                Company workspace
              </div>
              <h1 className="mt-1 text-xl font-semibold tracking-tight">
                Welcome back, {session.name}
              </h1>
              <p className="mt-1 text-sm text-indigo-100/90">
                See who&apos;s online and jump into a project board.
              </p>
            </div>
            <NewProjectButton />
          </div>
        </section>

        {/* Users */}
        <section className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Team</h2>
            <span className="text-xs text-slate-500">{users.length} members</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <span
                key={u._id.toString()}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-semibold text-white">
                  {u.name[0]?.toUpperCase()}
                </span>
                {u.name}
              </span>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Projects</h2>
            <span className="text-xs text-slate-500">
              {projects.length === 0 ? "No projects yet" : `${projects.length} active`}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard
                key={p._id.toString()}
                project={{ id: p._id.toString(), name: p.name }}
              />
            ))}
            {projects.length === 0 ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500">
                Create your first project to start tracking tasks.
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

