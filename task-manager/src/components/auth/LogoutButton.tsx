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
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setLoading(false);
      router.replace("/login"); // better than push
      router.refresh();
    }
  }

  return (
    <Button onClick={onClick} disabled={loading}>
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}
