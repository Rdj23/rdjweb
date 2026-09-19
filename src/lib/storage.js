// localStorage throws in private-mode Safari and when site data is blocked,
// and JSON.parse throws on anything a previous version left behind. Every
// read and write goes through here so a storage failure degrades to "no saved
// data" instead of a blank screen.

export function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* nothing we can do, and nothing the user needs to know */
  }
}

export function readSession(key, fallback) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeSession(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function removeSession(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  identity: "user_identity",
  profile: "user_profile",
  bookings: "rdj_bookings_v1",
  watchlist: "rdj_watchlist_v1",
  city: "rdj_city_v1",
  pendingIntent: "rdj_pending_intent_v1",
};
