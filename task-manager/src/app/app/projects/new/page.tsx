"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "");

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
    router.push(`/app/projects/${data.projectId}`);
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg rounded-3xl bg-white px-8 py-8 shadow-md shadow-slate-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">New project</h1>
            <p className="text-xs text-slate-500">
              Name your project and we&apos;ll create a fresh board for it.
            </p>
          </div>
          <Link
            href="/app"
            className="cursor-pointer text-xs font-medium text-slate-500 underline-offset-4 hover:underline"
          >
            ← Back
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Project name">
            <Input name="name" required />
          </Field>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating…" : "Create"}
          </Button>
        </form>
      </div>
    </div>
  );
}

