// One place that knows every event name and property this app reports.
//
// Keeping the catalog here (rather than inline `ct.event.push` calls scattered
// through components) means the funnel stays auditable: you can read the whole
// booking journey top to bottom, and property names can't drift between the
// page that fires an event and the dashboard that charts it.
//
// Dates are sent as real `Date` objects, never strings. The CleverTap SDK turns
// those into date properties, which is what lets a campaign trigger relative to
// them - "remind me the day before my show" only works on a date property.

import {
  addEventToCleverTap,
  addChargedEventToCleverTap,
  pushProfileCommand,
} from "../utils/cleverTap";
import { titleOf, releaseDateOf, genreNames, imageUrl } from "./tmdb";
import { formatTime, showDateTime, daysUntil, addDays } from "./format";
import { toCinemaBlock } from "./shows";
import { cityName } from "./venues";

/**
 * Analytics must never take down a page.
 *
 * A mismatch between a payload builder and the object it reads used to throw
 * straight through the render that called it; wrapping each tracker keeps a
 * reporting bug to a console warning.
 */
const track = (name, fn) =>
  function trackSafely(...args) {
    try {
      return fn(...args);
    } catch (error) {
      console.warn(`[analytics] ${name} failed`, error);
      return undefined;
    }
  };

/* ------------------------------------------------------------------ */
/* Shared property blocks                                              */
/* ------------------------------------------------------------------ */

/** Title descriptor, identical on every content-related event. */
const titleProps = (item, mediaType) => ({
  "Content ID": item?.id,
  "Content Title": titleOf(item),
  "Content Type": mediaType === "tv" ? "series" : "movie",
  Genre: genreNames(item).join(", "),
  "Release Date": releaseDateOf(item),
  Rating: item?.vote_average ? Math.round(item.vote_average * 10) / 10 : undefined,
  poster_url: imageUrl(item?.poster_path, "w342") || undefined,
  backdrop_url: imageUrl(item?.backdrop_path, "w780") || undefined,
});

/** Title descriptor rebuilt from a stored booking, which has no TMDB payload. */
const storedTitleProps = (title) => ({
  "Content ID": title.id,
  "Content Title": title.name,
  "Content Type": title.mediaType === "tv" ? "series" : "movie",
  Genre: (title.genres || []).join(", "),
  "Release Year": title.year || undefined,
  poster_url: imageUrl(title.posterPath, "w342") || undefined,
});

/**
 * Showtime descriptor. Takes the flattened cinema block that drafts and
 * bookings store, so live and stored paths report identical properties.
 */
const cinemaProps = (cinema) => {
  const startsAt = showDateTime(cinema.dateKey, cinema.time);
  return {
    "Cinema Name": cinema.cinemaName,
    "Cinema Brand": cinema.cinemaBrand,
    "Cinema Area": cinema.area,
    City: cityName(cinema.city),
    Screen: cinema.screen,
    Format: cinema.format,
    Language: cinema.language,
    "Show Date": cinema.dateKey,
    "Show Time": formatTime(cinema.time),
    // Date property: campaigns trigger relative to this.
    "Show DateTime": startsAt,
    "Days Until Show": daysUntil(startsAt),
  };
};

const seatProps = (seats = []) => ({
  Seats: seats.map((s) => s.id).join(", "),
  "Seat Count": seats.length,
  "Seat Types": [...new Set(seats.map((s) => s.tierLabel || s.tierKey))].join(", "),
});

/* ------------------------------------------------------------------ */
/* Discovery                                                           */
/* ------------------------------------------------------------------ */

export const trackPageView = track("trackPageView", (pageName, extra = {}) =>
  addEventToCleverTap("Page Viewed", { "Page Name": pageName, ...extra })
);

export const trackContentViewed = track("trackContentViewed", (item, mediaType) =>
  addEventToCleverTap("Content Viewed", titleProps(item, mediaType))
);

export const trackSearch = track("trackSearch", (query, mediaType, resultCount) =>
  addEventToCleverTap("Search Performed", {
    "Search Query": query,
    "Content Type": mediaType === "tv" ? "series" : "movie",
    Results: resultCount,
  })
);

export const trackTrailerPlayed = track("trackTrailerPlayed", (item, mediaType) =>
  addEventToCleverTap("Trailer Played", titleProps(item, mediaType))
);

export const trackWatchlistAdded = track("trackWatchlistAdded", (item, mediaType) => {
  addEventToCleverTap("Added to Watchlist", titleProps(item, mediaType));
  pushProfileCommand({ Site: { watchlist: { $add: titleOf(item) } } });
});

export const trackWatchlistRemoved = track("trackWatchlistRemoved", (item, mediaType) => {
  addEventToCleverTap("Removed from Watchlist", titleProps(item, mediaType));
  pushProfileCommand({ Site: { watchlist: { $remove: titleOf(item) } } });
});

export const trackPreferencesSaved = track("trackPreferencesSaved", (profile) =>
  addEventToCleverTap("Preferences Saved", {
    "Favourite Genre": profile.FavGenre || undefined,
    "Favourite Director": profile.FavDirector || undefined,
    "Favourite Director ID": profile.FavDirectorId || undefined,
    "Favourite Language": profile.FavLanguage || undefined,
    "Favourite Language Code": profile.FavLanguageCode || undefined,
  })
);

export const trackCityChanged = track("trackCityChanged", (city) =>
  addEventToCleverTap("City Changed", { City: city })
);

/* ------------------------------------------------------------------ */
/* Booking funnel                                                      */
/* ------------------------------------------------------------------ */

export const trackShowtimesViewed = track(
  "trackShowtimesViewed",
  ({ item, mediaType, cityId, dateKey, showCount }) =>
    addEventToCleverTap("Showtimes Viewed", {
      ...titleProps(item, mediaType),
      City: cityName(cityId),
      "Show Date": dateKey,
      "Shows Available": showCount,
    })
);

export const trackShowSelected = track("trackShowSelected", ({ item, mediaType, show, cityId }) =>
  addEventToCleverTap("Showtime Selected", {
    ...titleProps(item, mediaType),
    ...cinemaProps(toCinemaBlock(show, cityId)),
    "From Price": show.fromPrice,
  })
);

export const trackSeatsSelected = track(
  "trackSeatsSelected",
  ({ item, mediaType, show, cityId, seats, total }) =>
    addEventToCleverTap("Seats Selected", {
      ...titleProps(item, mediaType),
      ...cinemaProps(toCinemaBlock(show, cityId)),
      ...seatProps(seats),
      "Ticket Total": total,
    })
);

export const trackPassSelected = track("trackPassSelected", ({ item, option, quality }) =>
  addEventToCleverTap("Pass Selected", {
    ...titleProps(item, "tv"),
    "Pass Type": option.kindLabel,
    "Pass Label": option.label,
    Quality: quality.label,
    Price: option.price,
  })
);

/** Reads the draft straight through, so it can't drift from what was selected. */
export const trackCheckoutStarted = track("trackCheckoutStarted", ({ draft }) => {
  const isCinema = draft.kind === "cinema";
  addEventToCleverTap("Checkout Started", {
    ...storedTitleProps(draft.title),
    "Booking Kind": isCinema ? "tickets" : "streaming pass",
    Quantity: isCinema ? draft.cinema.seats.length : 1,
    "Order Value": draft.amount.total,
    ...(isCinema
      ? { ...cinemaProps(draft.cinema), ...seatProps(draft.cinema.seats) }
      : {
          "Pass Type": draft.pass.kindLabel,
          "Pass Label": draft.pass.label,
          Quality: draft.pass.qualityLabel,
        }),
  });
});

export const trackPaymentMethodSelected = track("trackPaymentMethodSelected", (method) =>
  addEventToCleverTap("Payment Method Selected", { Method: method.label })
);

/* ------------------------------------------------------------------ */
/* Confirmation                                                        */
/* ------------------------------------------------------------------ */

/**
 * The booking event, split by content kind so each can be targeted directly:
 *   - "Movie Ticket Booked" carries the full showtime, including `Show DateTime`
 *     as a date property - this is what a pre-show reminder campaign triggers on.
 *   - "Series Pass Purchased" carries `Pass Expires On`, for renewal nudges.
 *
 * `Charged` is fired alongside this and stays the revenue event.
 */
export const trackBookingConfirmed = track("trackBookingConfirmed", (booking) => {
  const common = {
    "Booking ID": booking.id,
    ...storedTitleProps(booking.title),
    "Booked On": new Date(booking.createdAt),
    Amount: booking.amount.total,
    Currency: booking.amount.currency,
    "Payment Mode": booking.payment.method,
    "Customer Name": booking.contact.name,
    "Customer Email": booking.contact.email,
    "Customer Phone": booking.contact.phone || undefined,
  };

  if (booking.kind === "cinema") {
    addEventToCleverTap("Movie Ticket Booked", {
      ...common,
      ...cinemaProps(booking.cinema),
      ...seatProps(booking.cinema.seats),
      "Ticket Amount": booking.amount.subtotal,
      "Convenience Fee": booking.amount.fees,
      Tax: booking.amount.tax,
    });
    return;
  }

  const purchasedAt = new Date(booking.createdAt);
  addEventToCleverTap("Series Pass Purchased", {
    ...common,
    "Pass Type": booking.pass.kindLabel,
    "Pass Label": booking.pass.label,
    Season: booking.pass.seasonNumber ?? undefined,
    Episode: booking.pass.episodeNumber ?? undefined,
    "Episode Name": booking.pass.episodeName || undefined,
    Quality: booking.pass.qualityLabel,
    "Validity Days": booking.pass.validityDays,
    // Date property: drives "your pass expires soon" campaigns.
    "Pass Expires On": addDays(purchasedAt, booking.pass.validityDays),
  });
});

/** The revenue event - `Charged` is special-cased by CleverTap. */
export const trackCharged = track("trackCharged", (booking) => {
  const isCinema = booking.kind === "cinema";

  const items = isCinema
    ? booking.cinema.seats.map((seat) => ({
        "Content Title": booking.title.name,
        "Content Type": "movie",
        Category: "Cinema ticket",
        Seat: seat.id,
        "Seat Type": seat.tierLabel,
        Cinema: booking.cinema.cinemaName,
        Format: booking.cinema.format,
        Price: seat.price,
      }))
    : [
        {
          "Content Title": booking.title.name,
          "Content Type": "series",
          Category: "Streaming pass",
          "Pass Type": booking.pass.kindLabel,
          "Pass Label": booking.pass.label,
          Quality: booking.pass.qualityLabel,
          Price: booking.amount.subtotal,
        },
      ];

  addChargedEventToCleverTap({
    amount: booking.amount.total,
    chargedId: booking.id,
    items,
    "Payment Mode": booking.payment.method,
    Currency: booking.amount.currency,
    "Booking Kind": isCinema ? "tickets" : "streaming pass",
    ...storedTitleProps(booking.title),
    ...(isCinema
      ? { ...cinemaProps(booking.cinema), ...seatProps(booking.cinema.seats) }
      : {
          "Pass Type": booking.pass.kindLabel,
          "Pass Label": booking.pass.label,
          Quality: booking.pass.qualityLabel,
          "Pass Expires On": addDays(new Date(booking.createdAt), booking.pass.validityDays),
        }),
  });
});

export const trackBookingCancelled = track("trackBookingCancelled", (booking) =>
  addEventToCleverTap("Booking Cancelled", {
    "Booking ID": booking.id,
    ...storedTitleProps(booking.title),
    "Booking Kind": booking.kind === "cinema" ? "tickets" : "streaming pass",
    "Refund Amount": booking.amount.total,
    "Cancelled On": new Date(booking.cancelledAt || Date.now()),
    ...(booking.kind === "cinema"
      ? { ...cinemaProps(booking.cinema), ...seatProps(booking.cinema.seats) }
      : { "Pass Type": booking.pass.kindLabel, "Pass Label": booking.pass.label }),
  })
);
