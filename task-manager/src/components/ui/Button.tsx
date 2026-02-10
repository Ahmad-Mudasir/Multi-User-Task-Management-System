import * as React from "react";

type Variant = "primary" | "secondary";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className = "", variant = "primary", ...props }: Props) {
  const base =
    "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-indigo-500 text-white hover:bg-indigo-600"
      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50";

  return <button {...props} className={[base, styles, className].join(" ")} />;
}

