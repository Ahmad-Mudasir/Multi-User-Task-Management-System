"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export function NewProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Failed to create project");
      return;
    }
    const data = (await res.json()) as { projectId: string };
    setOpen(false);
    setName("");
    router.push(`/app/projects/${data.projectId}`);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New project</Button>

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white px-6 py-6 shadow-2xl shadow-slate-700/30">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Create project</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-7 w-7 cursor-pointer rounded-full text-center text-sm text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <form onSubmit={createProject} className="space-y-4">
              <Field label="Project name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  placeholder="e.g. Marketing website"
                  required
                />
              </Field>
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  className="px-3"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !name.trim()} className="px-4">
                  {loading ? "Creating…" : "Create project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

