import React, { useMemo } from "react";
import { formatMoney } from "../../lib/format";

/**
 * Interactive seat grid.
 *
 * Rows arrive back-of-house first so the screen graphic can sit at the bottom,
 * matching how cinema apps orient their maps. Rows are grouped into price tiers
 * for the headings.
 */
export default function SeatMap({ seatMap, selected, onToggle, maxSeats }) {
  const groups = useMemo(() => {
    const out = [];
    for (const row of seatMap.rows) {
      const last = out[out.length - 1];
      if (last && last.tierKey === row.tierKey) last.rows.push(row);
      else out.push({ tierKey: row.tierKey, tierLabel: row.tierLabel, price: row.price, rows: [row] });
    }
    return out;
  }, [seatMap]);

  const atLimit = selected.size >= maxSeats;

  return (
    <div className="space-y-5">
      <div className="no-scrollbar overflow-x-auto pb-2">
        <div className="mx-auto w-fit min-w-[340px] space-y-6 px-1">
          {groups.map((group) => (
            <div key={group.tierKey} className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-400">
                  {group.tierLabel}
                </span>
                <span className="text-[11px] font-semibold text-brand-300">
                  {formatMoney(group.price)}
                </span>
                <span className="h-px flex-1 bg-ink-800" />
              </div>

              {group.rows.map((row) => (
                <div key={row.row} className="flex items-center gap-2">
                  <span className="w-4 text-center text-[10px] font-bold text-ink-500">
                    {row.row}
                  </span>
                  <div className="flex gap-1">
                    {row.cells.map((cell) => {
                      if (cell.type === "gap") return <span key={cell.id} className="w-3" />;

                      const isSelected = selected.has(cell.id);
                      const blocked = cell.sold || (atLimit && !isSelected);

                      return (
                        <button
                          key={cell.id}
                          type="button"
                          disabled={blocked}
                          aria-pressed={isSelected}
                          aria-label={
                            cell.sold
                              ? `Seat ${cell.id}, sold`
                              : `Seat ${cell.id}, ${row.tierLabel}, ${formatMoney(cell.price)}`
                          }
                          onClick={() => onToggle(cell)}
                          className={[
                            "h-6 w-6 rounded-[5px] border text-[9px] font-bold transition-all duration-150",
                            cell.sold
                              ? "cursor-not-allowed border-ink-800 bg-ink-800 text-ink-700"
                              : isSelected
                                ? "scale-110 border-brand-400 bg-brand-400 text-ink-950 shadow-glow"
                                : atLimit
                                  ? "cursor-not-allowed border-ink-750 bg-ink-900 text-ink-600"
                                  : "border-emerald-500/50 bg-ink-900 text-emerald-300/80 hover:border-emerald-400 hover:bg-emerald-500/20",
                          ].join(" ")}
                        >
                          {cell.number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="pt-4">
            <div className="mx-auto h-1.5 w-3/4 rounded-full bg-gradient-to-r from-transparent via-brand-400 to-transparent" />
            <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-ink-500">
              All eyes this way
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-[11px] font-medium text-ink-400">
        <LegendSwatch className="border-emerald-500/50 bg-ink-900" label="Available" />
        <LegendSwatch className="border-brand-400 bg-brand-400" label="Selected" />
        <LegendSwatch className="border-ink-800 bg-ink-800" label="Sold" />
      </div>

      {atLimit && (
        <p className="text-center text-xs text-amber-300">
          You can book up to {maxSeats} seats in one transaction.
        </p>
      )}
    </div>
  );
}

function LegendSwatch({ className, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-4 w-4 rounded-[4px] border ${className}`} />
      {label}
    </span>
  );
}
