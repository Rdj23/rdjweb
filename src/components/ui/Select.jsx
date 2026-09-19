import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { IconChevronDown, IconCheck } from "./Icons";

/**
 * Themed dropdown.
 *
 * A native <select> renders its option list through the OS, which ignores the
 * app's styling entirely - on a dark page you get a white menu with the system
 * highlight colour. This is a button plus an ARIA listbox so the open state
 * matches the rest of the UI, while keeping the keyboard behaviour people
 * expect from a select: type-ahead, arrow keys, Home/End, Enter, Escape.
 */
export default function Select({
  value,
  onChange,
  options,
  label,
  placeholder = "Select",
  fullWidth = false,
  className = "",
  align = "left",
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const typeahead = useRef({ query: "", timer: null });
  const listId = useId();

  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.value === value),
    [options, value]
  );
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (refocus) buttonRef.current?.focus();
  }, []);

  const openList = useCallback(
    (startIndex = selectedIndex) => {
      setActiveIndex(startIndex >= 0 ? startIndex : 0);
      setOpen(true);
    },
    [selectedIndex]
  );

  const choose = useCallback(
    (index) => {
      const option = options[index];
      if (!option) return;
      onChange(option.value);
      close();
    },
    [options, onChange, close]
  );

  // Dismiss on an outside press or any scroll of an ancestor, so the popup
  // never floats away from its trigger.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const handleTypeahead = (key) => {
    const state = typeahead.current;
    clearTimeout(state.timer);
    state.query += key.toLowerCase();
    state.timer = setTimeout(() => {
      state.query = "";
    }, 600);

    const match = options.findIndex((o) => o.label.toLowerCase().startsWith(state.query));
    if (match >= 0) setActiveIndex(match);
  };

  const onKeyDown = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openList();
        else setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openList();
        else setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) openList();
        else choose(activeIndex);
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          close();
        }
        break;
      case "Tab":
        if (open) close(false);
        break;
      default:
        if (open && e.key.length === 1 && !e.metaKey && !e.ctrlKey) handleTypeahead(e.key);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && <span className="sr-only">{label}</span>}

      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={label}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={`flex items-center justify-between gap-2 rounded-xl border bg-ink-850 px-3.5 py-2.5 text-sm font-medium transition-colors ${
          fullWidth ? "w-full" : ""
        } ${
          open
            ? "border-brand-400/60 text-white"
            : "border-ink-750 text-ink-200 hover:border-ink-600 hover:text-white"
        }`}
      >
        <span className={`truncate ${selected ? "" : "text-ink-500"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <IconChevronDown
          size={15}
          className={`shrink-0 text-ink-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          onKeyDown={onKeyDown}
          className={`absolute z-50 mt-1.5 max-h-64 min-w-full animate-fade-up overflow-y-auto rounded-xl border border-ink-700 bg-ink-850 p-1 shadow-lift focus:outline-none ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-ink-750 text-white" : "text-ink-200"
                } ${isSelected ? "font-semibold text-brand-300" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.detail && (
                    <span className="block truncate text-xs text-ink-500">{option.detail}</span>
                  )}
                </span>
                {isSelected && <IconCheck size={15} className="shrink-0 text-brand-400" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
