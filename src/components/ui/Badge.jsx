import React from "react";

const tones = {
  default: "bg-ink-750 text-ink-200 border-ink-600",
  brand: "bg-brand-400/15 text-brand-300 border-brand-400/30",
  ok: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  danger: "bg-crimson-500/15 text-crimson-400 border-crimson-500/30",
  muted: "bg-ink-800 text-ink-400 border-ink-700",
};

export default function Badge({ tone = "default", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
