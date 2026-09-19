import React from "react";
import Button from "../ui/Button";
import { formatMoney } from "../../lib/format";

/** Sticky bottom action bar used across the seat and pass steps. */
export default function SummaryBar({ label, sublabel, total, disabled, actionLabel, onAction }) {
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-8 border-t border-ink-800 bg-ink-900/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{label}</p>
          {sublabel && <p className="truncate text-xs text-ink-400">{sublabel}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-ink-500">Total</p>
            <p className="text-lg font-black leading-tight text-white">{formatMoney(total)}</p>
          </div>
          <Button onClick={onAction} disabled={disabled} size="lg">
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
