import Link from "next/link";

import { RegisterForm } from "@/components/auth/RegisterForm";
export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Create your workspace
        </h1>
        <p className="text-sm text-slate-500">
          Sign up once and get a shared company board for all your projects.
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
