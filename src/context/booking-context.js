import { createContext, useContext } from "react";

// See the note in auth-context.js - kept separate from the provider component
// so Fast Refresh stays reliable.
export const BookingContext = createContext(null);

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}
