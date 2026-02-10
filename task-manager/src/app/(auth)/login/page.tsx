import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500">
          Log in to your company workspace to continue collaborating on tasks.
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-600 underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

