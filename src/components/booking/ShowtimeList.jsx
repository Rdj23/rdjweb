import React, { useMemo, useState } from "react";
import { formatTime, formatMoney } from "../../lib/format";
import { FORMATS, LANGUAGES } from "../../lib/venues";
import { buildSeatMap, seatAvailabilityLabel } from "../../lib/shows";
import { IconPin } from "../ui/Icons";
import Badge from "../ui/Badge";
import Select from "../ui/Select";
import { EmptyState } from "../ui/States";

const toneClasses = {
  ok: "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10",
  warn: "border-amber-500/40 text-amber-300 hover:bg-amber-500/10",
  danger: "border-crimson-500/40 text-crimson-400 hover:bg-crimson-500/10",
  muted: "border-ink-700 text-ink-300 hover:bg-ink-800",
};

/** One showtime pill, annotated with how full the house already is. */
function ShowtimeButton({ show, onSelect }) {
  const availability = useMemo(() => {
    const map = buildSeatMap(show);
    return seatAvailabilityLabel(map);
  }, [show]);

  return (
    <button
      type="button"
      onClick={() => onSelect(show)}
      title={`${show.format.label} · ${show.language} · ${availability.label}`}
      className={`flex min-w-[92px] flex-col items-center gap-0.5 rounded-lg border bg-ink-900 px-3 py-2 transition-colors ${
        toneClasses[availability.tone]
      }`}
    >
      <span className="text-sm font-bold">{formatTime(show.time)}</span>
      <span className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
        {show.format.badge} · {show.language.slice(0, 3)}
      </span>
      <span className="text-[10px] font-semibold text-ink-500">
        from {formatMoney(show.fromPrice)}
      </span>
    </button>
  );
}

export default function ShowtimeList({ venues, onSelect }) {
  const [formatFilter, setFormatFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");

  // Only offer filters that actually match something on this date.
  const { formatOptions, languageOptions } = useMemo(() => {
    const formats = new Set();
    const languages = new Set();
    venues.forEach(({ shows }) =>
      shows.forEach((s) => {
        formats.add(s.formatKey);
        languages.add(s.language);
      })
    );
    return {
      formatOptions: Object.keys(FORMATS).filter((k) => formats.has(k)),
      languageOptions: LANGUAGES.filter((l) => languages.has(l)),
    };
  }, [venues]);

  const filtered = useMemo(
    () =>
      venues
        .map(({ cinema, shows }) => ({
          cinema,
          shows: shows.filter(
            (s) =>
              (formatFilter === "all" || s.formatKey === formatFilter) &&
              (languageFilter === "all" || s.language === languageFilter)
          ),
        }))
        .filter((v) => v.shows.length > 0),
    [venues, formatFilter, languageFilter]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <Select
          label="Format"
          value={formatFilter}
          onChange={setFormatFilter}
          options={[
            { value: "all", label: "All formats" },
            ...formatOptions.map((k) => ({ value: k, label: FORMATS[k].label })),
          ]}
        />
        <Select
          label="Language"
          value={languageFilter}
          onChange={setLanguageFilter}
          options={[
            { value: "all", label: "All languages" },
            ...languageOptions.map((l) => ({ value: l, label: l })),
          ]}
        />
        <div className="ml-auto hidden items-center gap-3 text-[11px] font-medium text-ink-400 sm:flex">
          <Legend className="bg-emerald-400" label="Available" />
          <Legend className="bg-amber-400" label="Filling fast" />
          <Legend className="bg-crimson-500" label="Almost full" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No shows match those filters"
          description="Try a different format, language or date."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(({ cinema, shows }) => (
            <div key={cinema.id} className="surface p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white">
                    {cinema.brand} <span className="text-ink-300">· {cinema.name}</span>
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-400">
                    <IconPin size={13} />
                    {cinema.area}
                  </p>
                </div>
                {cinema.tier >= 2 && <Badge tone="brand">Premium</Badge>}
              </div>

              <div className="flex flex-wrap gap-2">
                {shows.map((show) => (
                  <ShowtimeButton key={show.id} show={show} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({ className, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}

