# Cineplex

A movie and series booking demo, instrumented end to end with CleverTap.

Browse a TMDB-powered catalog, then either **book cinema seats** for a movie
(city → cinema → showtime → seat map → checkout → ticket) or **buy a streaming
pass** for a series (episode / season / complete series, HD or 4K). Bookings,
watchlist and profile all persist in the browser.

## Running it

```bash
npm install
echo "VITE_TMDB_KEY=your_tmdb_v3_key" > .env
npm run dev
```

`npm run build` produces a static bundle; `npm run lint` must stay clean.

## How the booking data works

There is no ticketing backend. Cinemas, showtimes and seat availability are
generated on the client from a seed built out of `(title, cinema, date, time)`,
which has two useful properties:

- **Stable.** The same show always produces the same prices and the same sold
  seats, across re-renders, refreshes and revisits.
- **Self-describing show ids.** A show id like
  `mum-pvr-phoenix.2026-09-19.2145.imax` carries everything needed to rebuild
  the show, so `/book/movie/:id/seats/:showId` deep links survive a refresh with
  no state passed through the router.

The seed deliberately excludes anything fetched from TMDB, so the seats page can
price a show before the title detail request resolves.

Confirmed bookings go to `localStorage`, and seats you already hold for a show
are merged into its map as sold.

## Layout

```
src/
  lib/          seeded RNG, TMDB client, venues, show + seat generation,
                pass pricing, order totals, the analytics event catalog
  context/      auth and booking providers (hooks live in the *-context.js
                siblings so Fast Refresh stays reliable)
  hooks/        useTmdb (abortable + cached), useDebounced, useScrollTop
  components/   ui/ primitives, layout/, catalog/, booking/
  pages/        one per route; everything but Home is lazy-loaded
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home rails |
| `/movies`, `/series` | Browse by shelf, paginated |
| `/search?q=` | Search across movies and series |
| `/title/:type/:id` | Title detail, entry point to booking |
| `/book/movie/:id/shows` | Cinemas and showtimes for a date |
| `/book/movie/:id/seats/:showId` | Seat map |
| `/book/tv/:id/pass` | Pass, season, episode and quality picker |
| `/checkout` | Contact, payment method, order summary |
| `/bookings`, `/bookings/:id` | Booking list and ticket |
| `/watchlist`, `/profile`, `/login` | — |
| `/movie/:movieId` | Redirects to the `/title/movie/:id` form |

Everything from `/checkout` onward requires a signed-in identity; browsing
does not.

## CleverTap

`src/utils/cleverTap.js` is the SDK bridge (profile normalisation, the special
`Charged` event, guarded pushes). `src/lib/analytics.js` is the event catalog —
every event name and property the app reports lives there, so the funnel can be
read top to bottom:

`Page Viewed` → `Search Performed` → `Content Viewed` → `Showtimes Viewed` →
`Showtime Selected` → `Seats Selected` / `Pass Selected` → `Checkout Started` →
`Payment Method Selected` → `Movie Ticket Booked` / `Series Pass Purchased` +
`Charged` → `Booking Cancelled`

plus `Added to Watchlist`, `Removed from Watchlist`, `Trailer Played`,
`City Changed` and `UTM_Visited`.

`Charged` is sent with `Amount`, `Charged ID` and an `Items` array (one entry per
seat, or one per pass), which is what CleverTap's revenue reporting expects.

### Date properties

Dates go out as JavaScript `Date` objects, never strings, so CleverTap stores
them as date properties that campaigns can trigger relative to:

| Property | On | Use |
| --- | --- | --- |
| `Show DateTime` | `Movie Ticket Booked`, `Charged`, `Showtime Selected`, `Seats Selected` | Pre-show reminders ("2 hours before your show") |
| `Days Until Show` | same | Segment advance bookings vs. same-day |
| `Pass Expires On` | `Series Pass Purchased`, `Charged` | Renewal nudges before a pass lapses |
| `Booked On` / `Cancelled On` | booking events | Post-booking journeys |

So a ticket booked four days out carries `Show DateTime` = that show's start and
`Days Until Show` = 4, which is enough to build a reminder campaign without any
backend.

Every tracker in `analytics.js` is wrapped so a payload bug logs a warning
instead of throwing into the render that called it.

## Notes

- Payments are simulated; no gateway is called.
- The ticket code is a deterministic pattern, not a real QR encoding — there is
  no backend for a scanner to validate against.
- This product uses the TMDB API but is not endorsed or certified by TMDB.
