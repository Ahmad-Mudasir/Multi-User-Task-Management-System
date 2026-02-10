import * as React from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      {...props}
      className={[
        "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
        "outline-none ring-offset-slate-100 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1",
        className,
      ].join(" ")}
    />
  );
}

