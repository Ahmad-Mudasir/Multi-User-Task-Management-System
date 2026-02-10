"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors, we'll still try to navigate
    } finally {
      setLoading(false);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      className="w-full justify-start rounded-xl border border-slate-200 px-3 py-2 text-left text-xs font-normal text-slate-500 hover:bg-slate-50"
    >
      {loading ? "Logging out…" : "Log out"}
    </Button>
  );
}

