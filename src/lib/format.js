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
