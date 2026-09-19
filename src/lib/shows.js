// Showtime and seat-map generation.
//
// There is no ticketing backend, so inventory is derived from a seed built out
// of (title, cinema, date, time). Two consequences worth knowing:
//   - a show id is self-describing, so /book/.../seats deep links survive a
//     refresh without any state handed through the router;
//   - the seed deliberately excludes anything fetched from TMDB, so the seats
//     page can price a show before the title detail request has resolved.

import { createRandom, randomInt, pickOne, pickSome } from "./seed";
import { toDateKey, parseDateKey } from "./format";
import { FORMATS, LANGUAGES, SEAT_TIERS, cinemasForCity, findCinema } from "./venues";

const SLOTS = [
  "09:15", "10:30", "11:45", "13:00", "14:15", "15:30",
  "16:45", "18:00", "19:15", "20:30", "21:45", "23:00",
];

export const MAX_SEATS_PER_BOOKING = 10;
export const BOOKING_WINDOW_DAYS = 7;
export const CONVENIENCE_FEE_PER_TICKET = 35;
export const GST_RATE = 0.18;

/** The next `days` calendar dates, starting today, as "YYYY-MM-DD" keys. */
export function bookingDates(days = BOOKING_WINDOW_DAYS) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    return toDateKey(d);
  });
}

const isWeekend = (dateKey) => {
  const day = parseDateKey(dateKey).getDay();
  return day === 0 || day === 6;
};

const formatsFor = (cinemaTier) => {
  if (cinemaTier >= 2) return ["2d", "3d", "imax", "dolby", "4dx"];
  if (cinemaTier === 1) return ["2d", "3d", "dolby"];
  return ["2d"];
};

const cinemaMultiplier = (tier) => (tier >= 2 ? 1.25 : tier === 1 ? 1 : 0.75);

// A per-title demand factor, so a blockbuster is pricier than a quiet release.
// Derived from the id rather than TMDB's popularity score on purpose - see the
// note at the top of this file.
const demandFactor = (titleId) => 0.9 + createRandom(`demand|${titleId}`)() * 0.35;

export function seatPrice({ titleId, cinemaTier, formatKey, dateKey, tierKey }) {
  const base = SEAT_TIERS[tierKey].basePrice;
  const raw =
    base *
    (FORMATS[formatKey]?.multiplier ?? 1) *
    cinemaMultiplier(cinemaTier) *
    (isWeekend(dateKey) ? 1.15 : 1) *
    demandFactor(titleId);
  return Math.round(raw / 10) * 10;
}

/* ------------------------------------------------------------------ */
/* Show ids                                                            */
/* ------------------------------------------------------------------ */

// "mum-pvr-phoenix.2026-09-19.2145.imax" - dot-separated because no cinema id,
// date, time or format key contains a dot.
export const encodeShowId = ({ cinemaId, dateKey, time, formatKey }) =>
  `${cinemaId}.${dateKey}.${time.replace(":", "")}.${formatKey}`;

export function decodeShowId(showId) {
  const parts = String(showId || "").split(".");
  if (parts.length !== 4) return null;
  const [cinemaId, dateKey, hhmm, formatKey] = parts;
  if (!/^\d{4}$/.test(hhmm) || !FORMATS[formatKey]) return null;
  return {
    cinemaId,
    dateKey,
    time: `${hhmm.slice(0, 2)}:${hhmm.slice(2)}`,
    formatKey,
  };
}

/* ------------------------------------------------------------------ */
/* Show generation                                                     */
/* ------------------------------------------------------------------ */

function buildShow({ titleId, cinema, dateKey, time, formatKey, language, screen }) {
  const id = encodeShowId({ cinemaId: cinema.id, dateKey, time, formatKey });
  const prices = Object.fromEntries(
    Object.keys(SEAT_TIERS).map((tierKey) => [
      tierKey,
      seatPrice({ titleId, cinemaTier: cinema.tier, formatKey, dateKey, tierKey }),
    ])
  );
  return {
    id,
    titleId: String(titleId),
    cinemaId: cinema.id,
    cinema,
    dateKey,
    time,
    formatKey,
    format: FORMATS[formatKey],
    language,
    screen,
    prices,
    fromPrice: Math.min(...Object.values(prices)),
  };
}

/** All cinemas in `cityId` carrying `titleId` on `dateKey`, with their shows. */
export function showsForTitle({ titleId, cityId, dateKey }) {
  const cinemas = cinemasForCity(cityId);

  const venues = cinemas
    .map((cinema) => {
      const rand = createRandom(`shows|${titleId}|${cinema.id}|${dateKey}`);
      // Not every screen carries every title.
      const carries = rand() > 0.18;
      const count = randomInt(rand, 3, 6);
      const times = pickSome(rand, SLOTS, count).sort();
      const available = formatsFor(cinema.tier);
      const languagePool = LANGUAGES.slice(0, randomInt(rand, 1, LANGUAGES.length));

      const shows = times.map((time) =>
        buildShow({
          titleId,
          cinema,
          dateKey,
          time,
          formatKey: pickOne(rand, available),
          language: pickOne(rand, languagePool),
          screen: `Screen ${randomInt(rand, 1, 6)}`,
        })
      );

      return { cinema, shows, carries };
    })
    .filter((v) => v.carries);

  // A city with nothing playing would be a dead end; guarantee at least two.
  if (venues.length < 2) {
    return cinemas.slice(0, 2).map((cinema) => {
      const rand = createRandom(`fallback|${titleId}|${cinema.id}|${dateKey}`);
      const times = pickSome(rand, SLOTS, 4).sort();
      return {
        cinema,
        shows: times.map((time) =>
          buildShow({
            titleId,
            cinema,
            dateKey,
            time,
            formatKey: pickOne(rand, formatsFor(cinema.tier)),
            language: pickOne(rand, LANGUAGES.slice(0, 2)),
            screen: `Screen ${randomInt(rand, 1, 6)}`,
          })
        ),
      };
    });
  }

  return venues.map(({ cinema, shows }) => ({ cinema, shows }));
}

/** Rebuild a single show from its id - used by deep links into /seats. */
export function resolveShow({ titleId, cityId, showId }) {
  const decoded = decodeShowId(showId);
  if (!decoded) return null;
  const cinema = findCinema(cityId, decoded.cinemaId);
  if (!cinema) return null;
  return buildShow({
    titleId,
    cinema,
    dateKey: decoded.dateKey,
    time: decoded.time,
    formatKey: decoded.formatKey,
    language: LANGUAGES[0],
    screen: `Screen ${randomInt(createRandom(showId), 1, 6)}`,
  });
}

/* ------------------------------------------------------------------ */
/* Seat maps                                                           */
/* ------------------------------------------------------------------ */

const ROW_TIER = Object.fromEntries(
  Object.values(SEAT_TIERS).flatMap((tier) => tier.rows.map((row) => [row, tier.key]))
);

// Back of the house first, so the screen graphic sits at the bottom of the map.
const DISPLAY_ROWS = ["L", "K", "J", "H", "G", "F", "E", "D", "C", "B", "A"];

// Evening and weekend shows run fuller, which makes the map look plausible.
function occupancyRate(show) {
  const rand = createRandom(`fill|${show.titleId}|${show.id}`);
  const hour = Number(show.time.slice(0, 2));
  const evening = hour >= 18 ? 0.18 : hour >= 15 ? 0.08 : 0;
  const weekend = isWeekend(show.dateKey) ? 0.12 : 0;
  return Math.min(0.92, 0.18 + rand() * 0.42 + evening + weekend);
}

/**
 * Build the seat grid for a show.
 * @param {object} show           from showsForTitle / resolveShow
 * @param {Set<string>} ownSeats  seats this browser has already booked for the
 *                                show, so they read as sold after a refresh
 */
export function buildSeatMap(show, ownSeats = new Set()) {
  const fill = occupancyRate(show);
  const rows = DISPLAY_ROWS.map((row) => {
    const tierKey = ROW_TIER[row];
    const tier = SEAT_TIERS[tierKey];
    const rand = createRandom(`seats|${show.id}|${row}`);
    const total = tier.seatsPerRow;
    const aisleAfter = total >= 20 ? [2, 18] : [2, 10];

    const cells = [];
    for (let n = 1; n <= total; n++) {
      const id = `${row}${n}`;
      cells.push({
        type: "seat",
        id,
        row,
        number: n,
        tierKey,
        price: show.prices[tierKey],
        sold: ownSeats.has(id) || rand() < fill,
      });
      if (aisleAfter.includes(n) && n !== total) cells.push({ type: "gap", id: `${row}-gap-${n}` });
    }
    return { row, tierKey, tierLabel: tier.label, price: show.prices[tierKey], cells };
  });

  const seats = rows.flatMap((r) => r.cells.filter((c) => c.type === "seat"));
  return {
    rows,
    totalSeats: seats.length,
    availableSeats: seats.filter((s) => !s.sold).length,
  };
}

export const seatAvailabilityLabel = (map) => {
  if (!map.totalSeats) return { label: "", tone: "muted" };
  const ratio = map.availableSeats / map.totalSeats;
  if (ratio <= 0.1) return { label: "Almost full", tone: "danger" };
  if (ratio <= 0.35) return { label: "Filling fast", tone: "warn" };
  return { label: "Available", tone: "ok" };
};

/**
 * Flatten a live show into the shape that drafts, bookings and analytics all
 * consume. Everything downstream of seat selection reads this one structure,
 * so the booking flow and the event payloads can't drift apart.
 */
export const toCinemaBlock = (show, cityId, seats = []) => ({
  showId: show.id,
  cinemaId: show.cinema.id,
  cinemaName: `${show.cinema.brand} ${show.cinema.name}`,
  cinemaBrand: show.cinema.brand,
  area: show.cinema.area,
  city: cityId,
  dateKey: show.dateKey,
  time: show.time,
  format: show.format.label,
  language: show.language,
  screen: show.screen,
  seats,
});
