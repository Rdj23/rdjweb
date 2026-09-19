import React from "react";
import Button from "./Button";
import { IconAlert, IconFilm } from "./Icons";

export function EmptyState({ icon: Icon = IconFilm, title, description, action }) {
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink-800 text-ink-400">
        <Icon size={26} />
      </span>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-400">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="surface flex flex-col items-center gap-3 border-crimson-500/25 px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-crimson-500/10 text-crimson-400">
        <IconAlert size={26} />
      </span>
      <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
      <p className="max-w-md text-sm text-ink-400">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Spinner({ size = 20, className = "" }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-ink-600 border-t-brand-400 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}
