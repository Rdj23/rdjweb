const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatMoney = (amount) => inr.format(Math.round(amount || 0));

export const formatRuntime = (minutes) => {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

export const yearOf = (dateStr) => (dateStr ? String(dateStr).slice(0, 4) : "");

// "2026-09-19" -> a Date pinned to local noon, so DST and timezone shifts
// can never roll a booking date onto the neighbouring day.
export const parseDateKey = (key) => {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
};

export const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const formatDateLabel = (key, { weekday = "short" } = {}) =>
  parseDateKey(key).toLocaleDateString("en-IN", { weekday, day: "numeric", month: "short" });

// "21:45" -> "9:45 PM"
export const formatTime = (time) => {
  const [h, m] = String(time).split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/**
 * Combine a date key and a "HH:MM" slot into a real Date.
 * Sent to CleverTap as a Date object so the showtime becomes a date property
 * that campaigns can trigger relative to (e.g. remind 2 hours before).
 */
export const showDateTime = (dateKey, time) => {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  const [hh, mm] = String(time).split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
};

/** Whole calendar days from today to `target` (0 = today, negative = past). */
export const daysUntil = (target) => {
  const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((dayStart(new Date(target)) - dayStart(new Date())) / 86400000);
};

/** Add `days` to a date and return the result. */
export const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
