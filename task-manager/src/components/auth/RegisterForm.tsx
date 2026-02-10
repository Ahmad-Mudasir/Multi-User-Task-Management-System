"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const companyName = String(form.get("companyName") || "");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password, companyName }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Registration failed");
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Name">
        <Input name="name" autoComplete="name" required />
      </Field>
      <Field label="Company name">
        <Input name="companyName" autoComplete="organization" required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}

