"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTransition, useState } from "react";

type Props = {
  project: {
    id: string;
    name: string;
  };
};

export function ProjectCard({ project }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (deleting || !confirm("Delete this project and all its tasks?")) return;
    setDeleting(true);
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) return;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="group flex items-start justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 hover:border-zinc-600 hover:bg-zinc-900/90">
      <Link href={`/app/projects/${project.id}`} className="flex-1 cursor-pointer">
        <div className="text-base font-semibold text-zinc-50">{project.name}</div>
        <div className="text-sm text-zinc-400">Open board</div>
      </Link>
      <button
        type="button"
        onClick={onDelete}
        className="mt-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-zinc-800 text-xs text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:border-red-500 hover:text-red-300"
        aria-label="Delete project"
      >
        ✕
      </button>
      {(pending || deleting) && (
        <span className="sr-only">{deleting ? "Deleting…" : "Refreshing…"}</span>
      )}
    </div>
  );
}

