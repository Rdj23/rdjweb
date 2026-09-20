import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { IconSearch, IconCheck, IconClose } from "./Icons";
import { Spinner } from "./States";
import { isAbort } from "../../lib/tmdb";

/**
 * Searchable picker.
 *
 * Handles both shapes this app needs from one component:
 *   - a fixed list filtered client side (languages), and
 *   - an async lookup (directors, via TMDB people search).
 *
 * `allowCustom` keeps it free-form: whatever the user types can be committed
 * even when nothing matches, so a favourite that isn't in TMDB still saves.
 *
 * Options are `{ value, label, detail?, image?, meta? }`.
 */
export default function Combobox({
  value,
  onChange,
  options,
  loadOptions,
  placeholder = "Search…",
  label,
  allowCustom = false,
  emptyText = "No matches",
  minChars = 2,
  debounceMs = 300,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(options || []);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();

  const isAsync = typeof loadOptions === "function";

  /* ----------------------------- option source ---------------------------- */

  // Static list: filter on every keystroke, no effect needed.
  useEffect(() => {
    if (isAsync) return undefined;
    const q = query.trim().toLowerCase();
    const list = options || [];
    setResults(
      q
        ? list.filter(
            (o) =>
              o.label.toLowerCase().includes(q) ||
              (o.detail || "").toLowerCase().includes(q)
          )
        : list
    );
    setActiveIndex(0);
    return undefined;
  }, [query, options, isAsync]);

  // Async list: debounce, and abort a stale lookup so a slow response can't
  // overwrite results for a query the user has already moved on from.
  useEffect(() => {
    if (!isAsync || !open) return undefined;
    const q = query.trim();
    if (q.length < minChars) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);

    const timer = setTimeout(() => {
      loadOptions(q, controller.signal)
        .then((list) => {
          if (!active) return;
          setResults(list);
          setActiveIndex(0);
        })
        .catch((error) => {
          if (active && !isAbort(error)) setResults([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, debounceMs);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open, isAsync, minChars, debounceMs]);

  /* ------------------------------- behaviour ------------------------------ */

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  const commit = (option) => {
    onChange(option);
    close();
    inputRef.current?.blur();
  };

  const customOption =
    allowCustom && query.trim().length > 0 &&
    !results.some((o) => o.label.toLowerCase() === query.trim().toLowerCase())
      ? { value: `custom:${query.trim()}`, label: query.trim(), custom: true }
      : null;

  const rows = customOption ? [...results, customOption] : results;

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && rows[activeIndex]) commit(rows[activeIndex]);
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        close();
      }
    }
  };

  /* -------------------------------- render -------------------------------- */

  return (
    <div ref={containerRef} className="relative">
      {value ? (
        // A chosen value reads as a chip rather than text in a box - it makes
        // "this is saved" obvious, and gives the clear action somewhere to live.
        <div className="flex items-center gap-3 rounded-xl border border-brand-400/40 bg-brand-400/10 p-2.5">
          {value.image !== undefined && (
            <img
              src={value.image}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full border border-ink-700 object-cover"
            />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{value.label}</span>
            {value.detail && (
              <span className="block truncate text-xs text-ink-400">{value.detail}</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            aria-label={`Clear ${label || "selection"}`}
            className="shrink-0 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-white"
          >
            <IconClose size={16} />
          </button>
        </div>
      ) : (
        <>
          <IconSearch
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-autocomplete="list"
            aria-label={label}
            value={query}
            placeholder={placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="w-full rounded-xl border border-ink-750 bg-ink-900 py-2.5 pl-10 pr-10 text-sm text-ink-100 placeholder:text-ink-600 transition-colors focus:border-brand-400/60 focus:bg-ink-850"
          />
          {loading && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <Spinner size={15} />
            </span>
          )}
        </>
      )}

      {open && !value && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-50 mt-1.5 max-h-72 w-full animate-fade-up overflow-y-auto rounded-xl border border-ink-700 bg-ink-850 p-1 shadow-lift"
        >
          {isAsync && query.trim().length < minChars && !customOption ? (
            <li className="px-3 py-3 text-xs text-ink-500">
              Type at least {minChars} characters to search.
            </li>
          ) : rows.length === 0 ? (
            <li className="px-3 py-3 text-xs text-ink-500">{loading ? "Searching…" : emptyText}</li>
          ) : (
            rows.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(option)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${
                  index === activeIndex ? "bg-ink-750" : ""
                }`}
              >
                {option.image !== undefined && !option.custom && (
                  <img
                    src={option.image}
                    alt=""
                    loading="lazy"
                    className="h-9 w-9 shrink-0 rounded-full border border-ink-700 object-cover"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink-100">
                    {option.custom ? (
                      <>
                        Use “<span className="font-semibold text-brand-300">{option.label}</span>”
                      </>
                    ) : (
                      option.label
                    )}
                  </span>
                  {option.detail && (
                    <span className="block truncate text-xs text-ink-500">{option.detail}</span>
                  )}
                  {option.custom && (
                    <span className="block text-xs text-ink-500">Save exactly what you typed</span>
                  )}
                </span>
                {index === activeIndex && <IconCheck size={15} className="shrink-0 text-brand-400" />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
