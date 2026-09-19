import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SeatMap from "../components/booking/SeatMap";
import SummaryBar from "../components/booking/SummaryBar";
import Badge from "../components/ui/Badge";
import { EmptyState } from "../components/ui/States";
import { IconChevronLeft, IconCalendar, IconClock, IconPin } from "../components/ui/Icons";
import { useTmdb } from "../hooks/useTmdb";
import { useScrollTop } from "../hooks/useScrollTop";
import { getTitleDetail, posterUrl, titleOf, releaseDateOf, genreNames } from "../lib/tmdb";
import { formatDateLabel, formatTime, formatMoney, yearOf } from "../lib/format";
import { resolveShow, buildSeatMap, MAX_SEATS_PER_BOOKING } from "../lib/shows";
import { SEAT_TIERS } from "../lib/venues";
import { cinemaTotals } from "../lib/pricing";
import { useBooking } from "../context/booking-context";
import { trackSeatsSelected } from "../lib/analytics";

export default function SeatsPage() {
  const { id, showId } = useParams();
  const navigate = useNavigate();
  const { city, bookedSeatsForShow, setDraft } = useBooking();
  const [selected, setSelected] = useState(() => new Map());

  useScrollTop(showId);

  const show = useMemo(
    () => resolveShow({ titleId: id, cityId: city, showId }),
    [id, city, showId]
  );

  const ownSeats = useMemo(() => bookedSeatsForShow(showId), [bookedSeatsForShow, showId]);

  const seatMap = useMemo(
    () => (show ? buildSeatMap(show, ownSeats) : null),
    [show, ownSeats]
  );

  // Changing city invalidates the cinema this show belongs to; drop any
  // selection rather than carrying seats across venues.
  useEffect(() => setSelected(new Map()), [showId, city]);

  const { data: item } = useTmdb((signal) => getTitleDetail("movie", id, signal), [id]);

  const toggleSeat = useCallback((cell) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(cell.id)) next.delete(cell.id);
      else if (next.size < MAX_SEATS_PER_BOOKING) {
        next.set(cell.id, {
          id: cell.id,
          row: cell.row,
          number: cell.number,
          tierKey: cell.tierKey,
          tierLabel: SEAT_TIERS[cell.tierKey].label,
          price: cell.price,
        });
      }
      return next;
    });
  }, []);

  const seats = useMemo(
    () => [...selected.values()].sort((a, b) => a.row.localeCompare(b.row) || a.number - b.number),
    [selected]
  );

  const totals = useMemo(() => cinemaTotals(seats), [seats]);

  if (!show || !seatMap) {
    return (
      <EmptyState
        title="That show isn't available"
        description="The link may be for a different city, or the show has since been pulled. Pick another showtime to continue."
        action={
          <Link
            to={`/book/movie/${id}/shows`}
            className="rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-bold text-ink-950"
          >
            See showtimes
          </Link>
        }
      />
    );
  }

  const proceed = () => {
    if (!seats.length) return;
    if (item?.id) trackSeatsSelected({ item, mediaType: "movie", show, seats, total: totals.total });

    setDraft({
      kind: "cinema",
      title: {
        id: Number(id),
        mediaType: "movie",
        name: item ? titleOf(item) : "Your movie",
        posterPath: item?.poster_path || null,
        year: item ? yearOf(releaseDateOf(item)) : "",
        genres: item ? genreNames(item).slice(0, 3) : [],
      },
      cinema: {
        showId: show.id,
        cinemaId: show.cinema.id,
        cinemaName: `${show.cinema.brand} ${show.cinema.name}`,
        area: show.cinema.area,
        city,
        dateKey: show.dateKey,
        time: show.time,
        format: show.format.label,
        language: show.language,
        screen: show.screen,
        seats,
      },
      amount: totals,
    });
    navigate("/checkout");
  };

  return (
    <div className="space-y-6">
      <Link
        to={`/book/movie/${id}/shows`}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-400 transition-colors hover:text-brand-300"
      >
        <IconChevronLeft size={16} />
        Change showtime
      </Link>

      <header className="surface flex flex-wrap items-center gap-4 p-4">
        <img
          src={posterUrl(item?.poster_path, "w185")}
          alt=""
          className="h-20 w-14 shrink-0 rounded-lg border border-ink-800 object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-white">
            {item ? titleOf(item) : "Select your seats"}
          </h1>
          <p className="truncate text-sm text-ink-300">
            {show.cinema.brand} {show.cinema.name}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
            <span className="inline-flex items-center gap-1">
              <IconPin size={12} />
              {show.cinema.area}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconCalendar size={12} />
              {formatDateLabel(show.dateKey)}
            </span>
            <span className="inline-flex items-center gap-1">
              <IconClock size={12} />
              {formatTime(show.time)}
            </span>
            <span>{show.screen}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge tone="brand">{show.format.badge}</Badge>
          <Badge>{show.language}</Badge>
        </div>
      </header>

      <div className="surface p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white">
            {seats.length === 0
              ? "Choose your seats"
              : `${seats.length} seat${seats.length > 1 ? "s" : ""} selected`}
          </h2>
          <p className="text-xs text-ink-500">
            {seatMap.availableSeats} of {seatMap.totalSeats} seats available
          </p>
        </div>

        <SeatMap
          seatMap={seatMap}
          selected={new Set(selected.keys())}
          onToggle={toggleSeat}
          maxSeats={MAX_SEATS_PER_BOOKING}
        />
      </div>

      <SummaryBar
        label={seats.length ? seats.map((s) => s.id).join(", ") : "No seats selected"}
        sublabel={
          seats.length
            ? `${seats.length} × ticket · ${formatMoney(totals.subtotal)} + fees`
            : "Tap a seat on the map to begin"
        }
        total={totals.total}
        disabled={seats.length === 0}
        actionLabel="Proceed"
        onAction={proceed}
      />
    </div>
  );
}
