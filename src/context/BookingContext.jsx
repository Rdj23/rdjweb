import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BookingContext } from "./booking-context";
import {
  readJSON,
  writeJSON,
  readSession,
  writeSession,
  removeSession,
  STORAGE_KEYS,
} from "../lib/storage";
import { DEFAULT_CITY } from "../lib/venues";
import { trackBookingCancelled, trackCityChanged } from "../lib/analytics";

const DRAFT_KEY = "rdj_draft_v1";

// Booking references read like a real ticket: RDJ-7F2K9Q.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function bookingReference() {
  let out = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `RDJ-${out}`;
}

export function BookingProvider({ children }) {
  const [city, setCityState] = useState(() => readJSON(STORAGE_KEYS.city, DEFAULT_CITY));
  const [bookings, setBookings] = useState(() => readJSON(STORAGE_KEYS.bookings, []));
  const [watchlist, setWatchlist] = useState(() => readJSON(STORAGE_KEYS.watchlist, []));
  // The in-progress selection. Session-scoped so a refresh on /checkout keeps
  // the chosen seats, but a new tab starts clean.
  const [draft, setDraftState] = useState(() => readSession(DRAFT_KEY, null));

  useEffect(() => {
    writeJSON(STORAGE_KEYS.bookings, bookings);
  }, [bookings]);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.watchlist, watchlist);
  }, [watchlist]);

  const setCity = useCallback((cityId, cityLabel) => {
    setCityState(cityId);
    writeJSON(STORAGE_KEYS.city, cityId);
    trackCityChanged(cityLabel || cityId);
  }, []);

  const setDraft = useCallback((next) => {
    setDraftState(next);
    if (next) writeSession(DRAFT_KEY, next);
    else removeSession(DRAFT_KEY);
  }, []);

  const clearDraft = useCallback(() => setDraft(null), [setDraft]);

  /** Commit a draft into a confirmed booking and return it. */
  const confirmBooking = useCallback((booking) => {
    const confirmed = {
      ...booking,
      id: bookingReference(),
      createdAt: new Date().toISOString(),
      status: "confirmed",
    };
    setBookings((prev) => [confirmed, ...prev]);
    return confirmed;
  }, []);

  const cancelBooking = useCallback((bookingId) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId || b.status === "cancelled") return b;
        const cancelled = { ...b, status: "cancelled", cancelledAt: new Date().toISOString() };
        trackBookingCancelled(cancelled);
        return cancelled;
      })
    );
  }, []);

  const getBooking = useCallback(
    (bookingId) => bookings.find((b) => b.id === bookingId) || null,
    [bookings]
  );

  /**
   * Seats this browser already holds for a show, so the seat map shows them as
   * taken after a refresh instead of offering them again.
   */
  const bookedSeatsForShow = useCallback(
    (showId) => {
      const held = new Set();
      for (const b of bookings) {
        if (b.kind !== "cinema" || b.status === "cancelled") continue;
        if (b.cinema.showId !== showId) continue;
        for (const seat of b.cinema.seats) held.add(seat.id);
      }
      return held;
    },
    [bookings]
  );

  const isWatchlisted = useCallback(
    (id, mediaType) => watchlist.some((w) => String(w.id) === String(id) && w.mediaType === mediaType),
    [watchlist]
  );

  const toggleWatchlist = useCallback((entry) => {
    let added = false;
    setWatchlist((prev) => {
      const exists = prev.some(
        (w) => String(w.id) === String(entry.id) && w.mediaType === entry.mediaType
      );
      added = !exists;
      return exists
        ? prev.filter((w) => !(String(w.id) === String(entry.id) && w.mediaType === entry.mediaType))
        : [{ ...entry, addedAt: new Date().toISOString() }, ...prev];
    });
    return added;
  }, []);

  const value = useMemo(
    () => ({
      city,
      setCity,
      bookings,
      confirmBooking,
      cancelBooking,
      getBooking,
      bookedSeatsForShow,
      watchlist,
      isWatchlisted,
      toggleWatchlist,
      draft,
      setDraft,
      clearDraft,
    }),
    [
      city, setCity, bookings, confirmBooking, cancelBooking, getBooking,
      bookedSeatsForShow, watchlist, isWatchlisted, toggleWatchlist,
      draft, setDraft, clearDraft,
    ]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

