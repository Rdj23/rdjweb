import React from "react";
import { parseDateKey } from "../../lib/format";

const WEEKDAY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export default function DateStrip({ dates, value, onChange }) {
  return (
    <div
      className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
      role="radiogroup"
      aria-label="Show date"
    >
      {dates.map((key, index) => {
        const date = parseDateKey(key);
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            className={`flex w-[68px] shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 transition-colors ${
              selected
                ? "border-brand-400 bg-brand-400 text-ink-950"
                : "border-ink-750 bg-ink-850 text-ink-300 hover:border-ink-600 hover:text-white"
            }`}
          >
            <span className="text-[10px] font-bold tracking-wider opacity-80">
              {index === 0 ? "TODAY" : WEEKDAY[date.getDay()]}
            </span>
            <span className="text-xl font-black leading-none">{date.getDate()}</span>
            <span className="text-[10px] font-semibold tracking-wider opacity-80">
              {MONTH[date.getMonth()]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
