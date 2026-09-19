import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import Badge from "../components/ui/Badge";
import { Spinner } from "../components/ui/States";
import { IconChevronLeft, IconCalendar, IconClock, IconPin, IconCheck } from "../components/ui/Icons";
import { posterUrl } from "../lib/tmdb";
import { formatMoney, formatDateLabel, formatTime } from "../lib/format";
import { PAYMENT_METHODS } from "../lib/pricing";
import { useAuth } from "../context/auth-context";
import { useBooking } from "../context/booking-context";
import { useTmdb } from "../hooks/useTmdb";
import { useScrollTop } from "../hooks/useScrollTop";
import { getTitleDetail } from "../lib/tmdb";
import {
  trackCheckoutStarted,
  trackPaymentMethodSelected,
  trackBookingConfirmed,
  trackCharged,
  trackPageView,
} from "../lib/analytics";

const PROCESSING_MS = 1200;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { profile, identity, updateProfile } = useAuth();
  const { draft, clearDraft, confirmBooking } = useBooking();
  const [method, setMethod] = useState(PAYMENT_METHODS[0].key);
  const [processing, setProcessing] = useState(false);
  const [contact, setContact] = useState(() => ({
    name: profile.Name || "",
    email: profile.Email || identity || "",
    phone: profile.Phone || "",
  }));

  useScrollTop("checkout");

  useEffect(() => {
    trackPageView("Checkout");
  }, []);

  // The draft carries only what the booking steps captured; the poster and
  // genres come from the (cached) detail payload for the confirmation screen.
  const { data: item } = useTmdb(
    (signal) => getTitleDetail(draft.title.mediaType, draft.title.id, signal),
    [draft?.title?.mediaType, draft?.title?.id],
    { enabled: Boolean(draft?.title?.id) }
  );

  // Fired once the draft is in hand - it carries everything the event needs,
  // so this no longer waits on the TMDB detail request.
  useEffect(() => {
    if (draft) trackCheckoutStarted({ draft });
  }, [draft]);

  const selectedMethod = useMemo(
    () => PAYMENT_METHODS.find((m) => m.key === method) || PAYMENT_METHODS[0],
    [method]
  );

  const contactValid =
    contact.name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim());

  if (!draft) return <Navigate to="/" replace />;

  const isCinema = draft.kind === "cinema";

  const pay = () => {
    if (!contactValid || processing) return;
    setProcessing(true);
    trackPaymentMethodSelected(selectedMethod);

    // Stand-in for a payment gateway round trip.
    setTimeout(() => {
      const booking = confirmBooking({
        ...draft,
        title: { ...draft.title, posterPath: draft.title.posterPath || item?.poster_path || null },
        payment: { method: selectedMethod.label, methodKey: selectedMethod.key },
        contact: {
          name: contact.name.trim(),
          email: contact.email.trim().toLowerCase(),
          phone: contact.phone.trim(),
        },
      });

      // The booking event carries the showtime as a date property for
      // reminder campaigns; Charged stays the revenue event.
      trackBookingConfirmed(booking);
      trackCharged(booking);

      // Keep the CleverTap profile in step with what the buyer typed here.
      const profileChanges = { Name: contact.name.trim(), Email: contact.email.trim().toLowerCase() };
      if (contact.phone.trim()) profileChanges.Phone = contact.phone.trim();
      updateProfile(profileChanges);

      clearDraft();
      navigate(`/bookings/${booking.id}?new=1`, { replace: true });
    }, PROCESSING_MS);
  };

  const backLink = isCinema
    ? `/book/movie/${draft.title.id}/seats/${draft.cinema.showId}`
    : `/book/tv/${draft.title.id}/pass`;

  return (
    <div className="space-y-6">
      <Link
        to={backLink}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-400 transition-colors hover:text-brand-300"
      >
        <IconChevronLeft size={16} />
        {isCinema ? "Change seats" : "Change pass"}
      </Link>

      <h1 className="text-2xl font-black text-white sm:text-3xl">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="surface space-y-4 p-5">
            <h2 className="text-base font-semibold text-white">Contact details</h2>
            <p className="-mt-2 text-xs text-ink-500">
              We'll send the {isCinema ? "ticket" : "pass"} here.
            </p>

            <Field
              label="Full name"
              value={contact.name}
              onChange={(v) => setContact((c) => ({ ...c, name: v }))}
              placeholder="Your name"
              required
            />
            <Field
              label="Email"
              type="email"
              value={contact.email}
              onChange={(v) => setContact((c) => ({ ...c, email: v }))}
              placeholder="you@example.com"
              required
              error={
                contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)
                  ? "Enter a valid email address"
                  : null
              }
            />
            <Field
              label="Mobile"
              type="tel"
              value={contact.phone}
              onChange={(v) => setContact((c) => ({ ...c, phone: v }))}
              placeholder="+919876543210"
              hint="Optional"
            />
          </section>

          <section className="surface space-y-3 p-5">
            <h2 className="text-base font-semibold text-white">Payment method</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((m) => {
                const active = m.key === method;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    aria-pressed={active}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-3.5 text-left transition-colors ${
                      active ? "border-brand-400 bg-brand-400/10" : "border-ink-750 bg-ink-900 hover:border-ink-600"
                    }`}
                  >
                    <span>
                      <span className={`block text-sm font-semibold ${active ? "text-brand-300" : "text-white"}`}>
                        {m.label}
                      </span>
                      <span className="block text-xs text-ink-400">{m.detail}</span>
                    </span>
                    {active && <IconCheck size={16} className="shrink-0 text-brand-400" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-ink-500">
              No real payment is taken — this is a demo checkout.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="surface overflow-hidden">
            <div className="flex gap-3 border-b border-ink-750 p-4">
              <img
                src={posterUrl(draft.title.posterPath || item?.poster_path, "w185")}
                alt=""
                className="h-24 w-16 shrink-0 rounded-lg border border-ink-800 object-cover"
              />
              <div className="min-w-0">
                <h2 className="truncate font-bold text-white">{draft.title.name}</h2>
                <p className="text-xs text-ink-400">
                  {draft.title.year}
                  {draft.title.genres?.length ? ` · ${draft.title.genres.join(", ")}` : ""}
                </p>
                <div className="mt-1.5">
                  <Badge tone="brand">{isCinema ? "Cinema tickets" : "Streaming pass"}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-b border-ink-750 p-4 text-sm">
              {isCinema ? (
                <>
                  <Row label="Cinema" value={draft.cinema.cinemaName} />
                  <Row
                    label="When"
                    value={`${formatDateLabel(draft.cinema.dateKey)} · ${formatTime(draft.cinema.time)}`}
                    icon={IconCalendar}
                  />
                  <Row
                    label="Seats"
                    value={draft.cinema.seats.map((s) => s.id).join(", ")}
                  />
                  <Row label="Format" value={`${draft.cinema.format} · ${draft.cinema.language}`} />
                  <Row label="Screen" value={draft.cinema.screen} icon={IconPin} />
                </>
              ) : (
                <>
                  <Row label="Pass" value={draft.pass.kindLabel} />
                  <Row label="Includes" value={draft.pass.label} />
                  <Row label="Quality" value={draft.pass.qualityLabel} />
                  <Row
                    label="Access"
                    value={`${draft.pass.validityDays} days`}
                    icon={IconClock}
                  />
                </>
              )}
            </div>

            <div className="space-y-2 p-4 text-sm">
              <PriceRow label="Subtotal" value={draft.amount.subtotal} />
              {draft.amount.fees > 0 && (
                <PriceRow label={draft.amount.feeLabel || "Fees"} value={draft.amount.fees} />
              )}
              <PriceRow label="GST (18%)" value={draft.amount.tax} />
              <div className="mt-2 flex items-center justify-between border-t border-ink-750 pt-3">
                <span className="font-semibold text-white">Amount payable</span>
                <span className="text-xl font-black text-brand-400">
                  {formatMoney(draft.amount.total)}
                </span>
              </div>
            </div>

            <div className="border-t border-ink-750 p-4">
              <Button fullWidth size="lg" onClick={pay} disabled={!contactValid || processing}>
                {processing ? (
                  <>
                    <Spinner size={16} />
                    Processing…
                  </>
                ) : (
                  `Pay ${formatMoney(draft.amount.total)}`
                )}
              </Button>
              {!contactValid && (
                <p className="mt-2 text-center text-xs text-ink-500">
                  Add your name and a valid email to continue.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="inline-flex items-center gap-1.5 shrink-0 text-ink-400">
        {Icon && <Icon size={13} />}
        {label}
      </span>
      <span className="text-right font-medium text-ink-100">{value}</span>
    </div>
  );
}

function PriceRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-400">{label}</span>
      <span className="font-medium text-ink-100">{formatMoney(value)}</span>
    </div>
  );
}

