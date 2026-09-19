import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { EmptyState } from "../components/ui/States";
import { IconTicket, IconCalendar, IconClock, IconChevronRight } from "../components/ui/Icons";
import { posterUrl } from "../lib/tmdb";
import { formatMoney, formatDateLabel, formatTime, formatDateTime, toDateKey } from "../lib/format";
import { useBooking } from "../context/booking-context";
import { trackPageView } from "../lib/analytics";
import { useScrollTop } from "../hooks/useScrollTop";

export default function BookingsPage() {
  const { bookings } = useBooking();
  useScrollTop("bookings");

  useEffect(() => {
    trackPageView("My Bookings", { "Booking Count": bookings.length });
    // Count is a snapshot at mount; re-firing on every change would be noise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { upcoming, past } = useMemo(() => {
    const todayKey = toDateKey(new Date());
    const isUpcoming = (b) =>
      b.status !== "cancelled" && (b.kind === "pass" || b.cinema.dateKey >= todayKey);
    return {
      upcoming: bookings.filter(isUpcoming),
      past: bookings.filter((b) => !isUpcoming(b)),
    };
  }, [bookings]);

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={IconTicket}
        title="No bookings yet"
        description="Book cinema tickets for a movie or grab a streaming pass for a series, and it'll show up here."
        action={
          <div className="flex gap-3 pt-1">
            <Button to="/movies">Browse movies</Button>
            <Button to="/series" variant="secondary">
              Browse series
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-white sm:text-4xl">My bookings</h1>
        <p className="mt-1 text-sm text-ink-400">
          {upcoming.length} active · {past.length} past or cancelled
        </p>
      </header>

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Active</h2>
          {upcoming.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Past &amp; cancelled</h2>
          {past.map((booking) => (
            <BookingRow key={booking.id} booking={booking} dimmed />
          ))}
        </section>
      )}
    </div>
  );
}

function BookingRow({ booking, dimmed }) {
  const isCinema = booking.kind === "cinema";
  const cancelled = booking.status === "cancelled";

  return (
    <Link
      to={`/bookings/${booking.id}`}
      className={`surface flex items-center gap-4 p-4 transition-colors hover:border-brand-400/40 ${
        dimmed ? "opacity-70" : ""
      }`}
    >
      <img
        src={posterUrl(booking.title.posterPath, "w185")}
        alt=""
        loading="lazy"
        className="h-24 w-16 shrink-0 rounded-lg border border-ink-800 object-cover"
      />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-bold text-white">{booking.title.name}</h3>
          {cancelled ? (
            <Badge tone="danger">Cancelled</Badge>
          ) : (
            <Badge tone={isCinema ? "brand" : "ok"}>{isCinema ? "Tickets" : "Pass"}</Badge>
          )}
        </div>

        {isCinema ? (
          <>
            <p className="truncate text-sm text-ink-300">{booking.cinema.cinemaName}</p>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
              <span className="inline-flex items-center gap-1">
                <IconCalendar size={12} />
                {formatDateLabel(booking.cinema.dateKey)}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconClock size={12} />
                {formatTime(booking.cinema.time)}
              </span>
              <span>
                {booking.cinema.seats.length} seat{booking.cinema.seats.length > 1 ? "s" : ""} ·{" "}
                {booking.cinema.seats.map((s) => s.id).join(", ")}
              </span>
            </p>
          </>
        ) : (
          <>
            <p className="truncate text-sm text-ink-300">{booking.pass.label}</p>
            <p className="text-xs text-ink-400">
              {booking.pass.kindLabel} · {booking.pass.qualityLabel} · booked{" "}
              {formatDateTime(booking.createdAt)}
            </p>
          </>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="font-black text-white">{formatMoney(booking.amount.total)}</p>
        <p className="mt-0.5 font-mono text-[10px] text-ink-500">{booking.id}</p>
        <IconChevronRight size={16} className="ml-auto mt-1 text-ink-600" />
      </div>
    </Link>
  );
}
