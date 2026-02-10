import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      {/* Top nav */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-sm font-semibold text-white shadow-sm shadow-indigo-300">
              TF
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              TaskFlow
            </span>
          </div>
          <nav className="flex gap-2 text-sm">
            <Link
              href="/login"
              className="cursor-pointer rounded-full border border-slate-200 px-4 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="cursor-pointer rounded-full bg-indigo-500 px-4 py-1.5 font-medium text-white shadow-sm shadow-indigo-300 hover:bg-indigo-400"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* Main hero */}
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:flex-row md:items-center">
        {/* Left info panel */}
        <section className="hidden w-full md:block md:w-1/2">
          <div className="rounded-3xl bg-white px-8 py-8 shadow-md shadow-slate-200">
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Join TaskFlow
            </div>
            <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900">
              Real‑time teamwork.
            </h1>
            <p className="mb-6 text-sm text-slate-600">
              Create your workspace and track work on a shared Kanban board with live task timers.
            </p>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span>Secure email &amp; password authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span>Shared task timers across multiple users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-indigo-500" />
                <span>Drag‑and‑drop Kanban board per project</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Right auth card */}
        <section className="w-full md:w-1/2">
          <div className="relative mx-auto max-w-md">
            <div className="pointer-events-none absolute -inset-px rounded-3xl bg-linear-to-tr from-indigo-400/40 via-sky-300/40 to-indigo-400/40 opacity-70 blur-md" />
            <div className="relative rounded-3xl bg-white px-8 py-10 shadow-md shadow-slate-200">
              {children}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
