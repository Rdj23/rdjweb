import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import TicketCode from "../components/ui/TicketCode";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { EmptyState } from "../components/ui/States";
import { IconTicket, IconCheck, IconChevronLeft } from "../components/ui/Icons";
import { posterUrl } from "../lib/tmdb";
import { formatMoney, formatDateLabel, formatTime, formatDateTime } from "../lib/format";
import { useBooking } from "../context/booking-context";
import { useScrollTop } from "../hooks/useScrollTop";
import { trackPageView } from "../lib/analytics";

export default function TicketPage() {
  const { bookingId } = useParams();
  const [params] = useSearchParams();
  const { getBooking, cancelBooking } = useBooking();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const booking = getBooking(bookingId);
  const justBooked = params.get("new") === "1";

  useScrollTop(bookingId);

  useEffect(() => {
    trackPageView(justBooked ? "Booking Confirmation" : "Ticket", { "Booking ID": bookingId });
  }, [bookingId, justBooked]);

  if (!booking) {
    return (
      <EmptyState
        icon={IconTicket}
        title="Booking not found"
        description="Bookings are stored in this browser. If you cleared site data or opened this link elsewhere, it won't be here."
        action={<Button to="/bookings">See all bookings</Button>}
      />
    );
  }

  const isCinema = booking.kind === "cinema";
  const cancelled = booking.status === "cancelled";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/bookings"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-400 transition-colors hover:text-brand-300"
      >
        <IconChevronLeft size={16} />
        All bookings
      </Link>

      {justBooked && !cancelled && (
        <div className="flex animate-fade-up items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-ink-950">
            <IconCheck size={20} />
          </span>
          <div>
            <p className="font-bold text-white">
              {isCinema ? "Your seats are booked" : "Your pass is active"}
            </p>
            <p className="text-sm text-emerald-300/80">
              A confirmation is on its way to {booking.contact.email}.
            </p>
          </div>
        </div>
      )}

      {/* Ticket stub: two panels joined by a perforated notch. */}
      <article className={`overflow-hidden rounded-3xl border border-ink-750 bg-ink-850 shadow-lift ${cancelled ? "opacity-70" : ""}`}>
        <div className="flex gap-4 border-b border-dashed border-ink-700 p-5">
          <img
            src={posterUrl(booking.title.posterPath, "w342")}
            alt=""
            className="h-32 w-[88px] shrink-0 rounded-xl border border-ink-800 object-cover"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {cancelled ? (
                <Badge tone="danger">Cancelled</Badge>
              ) : (
                <Badge tone={isCinema ? "brand" : "ok"}>
                  {isCinema ? "Cinema ticket" : "Streaming pass"}
                </Badge>
              )}
              <Badge tone="muted">{booking.title.year}</Badge>
            </div>
            <h1 className="text-xl font-black leading-tight text-white sm:text-2xl">
              {booking.title.name}
            </h1>
            {isCinema ? (
              <p className="text-sm text-ink-300">
                {booking.cinema.cinemaName}
                <span className="block text-xs text-ink-500">{booking.cinema.area}</span>
              </p>
            ) : (
              <p className="text-sm text-ink-300">{booking.pass.label}</p>
            )}
          </div>
        </div>

        {/* Notch row - the visual "tear here" line. */}
        <div className="relative h-0">
          <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-ink-950" />
          <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-ink-950" />
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto]">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            {isCinema ? (
              <>
                <Detail label="Date" value={formatDateLabel(booking.cinema.dateKey, { weekday: "long" })} />
                <Detail label="Show time" value={formatTime(booking.cinema.time)} />
                <Detail label="Screen" value={booking.cinema.screen} />
                <Detail label="Format" value={`${booking.cinema.format} · ${booking.cinema.language}`} />
                <Detail
                  label={`Seat${booking.cinema.seats.length > 1 ? "s" : ""}`}
                  value={booking.cinema.seats.map((s) => s.id).join(", ")}
                  emphasis
                />
                <Detail
                  label="Tickets"
                  value={`${booking.cinema.seats.length} × ${booking.cinema.seats[0].tierLabel}`}
                />
              </>
            ) : (
              <>
                <Detail label="Pass" value={booking.pass.kindLabel} />
                <Detail label="Quality" value={booking.pass.qualityLabel} />
                <Detail label="Access" value={`${booking.pass.validityDays} days`} />
                <Detail label="Purchased" value={formatDateTime(booking.createdAt)} />
              </>
            )}
            <Detail label="Booking ID" value={booking.id} mono />
            <Detail label="Paid" value={formatMoney(booking.amount.total)} emphasis />
          </dl>

          <div className="flex flex-col items-center gap-2 justify-self-center">
            <TicketCode value={booking.id} />
            <p className="text-[10px] uppercase tracking-wider text-ink-500">
              {isCinema ? "Scan at the gate" : "Pass code"}
            </p>
          </div>
        </div>

        <div className="border-t border-ink-750 bg-ink-900 px-5 py-3 text-xs text-ink-500">
          Booked by {booking.contact.name} · {booking.contact.email} · paid via{" "}
          {booking.payment.method}
        </div>
      </article>

      <div className="flex flex-wrap gap-3">
        <Button to={`/title/${booking.title.mediaType}/${booking.title.id}`} variant="secondary">
          View title
        </Button>
        {!cancelled && (
          <Button variant="ghost" onClick={() => setConfirmingCancel(true)}>
            Cancel booking
          </Button>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ink-600">
        Bookings live in this browser only. Clearing site data removes them, and they won't appear
        on another device.
      </p>

      <Modal
        open={confirmingCancel}
        onClose={() => setConfirmingCancel(false)}
        title="Cancel this booking?"
        maxWidth="max-w-md"
      >
        <p className="text-sm text-ink-300">
          {isCinema
            ? `Seats ${booking.cinema.seats.map((s) => s.id).join(", ")} will be released and ${formatMoney(booking.amount.total)} refunded.`
            : `Your ${booking.pass.kindLabel.toLowerCase()} will end and ${formatMoney(booking.amount.total)} will be refunded.`}
        </p>
        <div className="mt-5 flex gap-3">
          <Button
            variant="danger"
            onClick={() => {
              cancelBooking(booking.id);
              setConfirmingCancel(false);
            }}
          >
            Yes, cancel it
          </Button>
          <Button variant="secondary" onClick={() => setConfirmingCancel(false)}>
            Keep booking
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Detail({ label, value, emphasis, mono }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-500">{label}</dt>
      <dd
        className={`mt-0.5 ${mono ? "font-mono text-xs" : ""} ${
          emphasis ? "text-base font-black text-brand-400" : "font-semibold text-ink-100"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
