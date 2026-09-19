import React from "react";

/** Labelled text input with optional hint and inline error. */
export default function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  hint,
  error,
  autoComplete,
  inputMode,
  maxLength,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-ink-200">
        {label}
        {required && <span className="text-crimson-400">*</span>}
        {hint && <span className="text-xs font-normal text-ink-500">({hint})</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-xl border bg-ink-900 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 transition-colors focus:bg-ink-850 ${
          error ? "border-crimson-500" : "border-ink-750 focus:border-brand-400/60"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-crimson-400">{error}</span>}
    </label>
  );
}
