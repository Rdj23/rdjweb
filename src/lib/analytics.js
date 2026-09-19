// One place that knows every event name and property this app reports.
//
// Keeping the catalog here (rather than inline `ct.event.push` calls scattered
// through components) means the funnel stays auditable: you can read the whole
// booking journey top to bottom, and property names can't drift between the
// page that fires an event and the dashboard that charts it.

import {
  addEventToCleverTap,
  addChargedEventToCleverTap,
  pushProfileCommand,
} from "../utils/cleverTap";
import { titleOf, releaseDateOf, genreNames, imageUrl } from "./tmdb";
import { formatTime } from "./format";

/** Shared descriptor so every content event carries the same title fields. */
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

const showProps = (show) => ({
  "Cinema Name": `${show.cinema.brand} ${show.cinema.name}`,
  "Cinema Area": show.cinema.area,
  "Show Date": show.dateKey,
  "Show Time": formatTime(show.time),
  Format: show.format.label,
  Language: show.language,
  Screen: show.screen,
});

export const trackPageView = (pageName, extra = {}) =>
  addEventToCleverTap("Page Viewed", { "Page Name": pageName, ...extra });

export const trackContentViewed = (item, mediaType) =>
  addEventToCleverTap("Content Viewed", titleProps(item, mediaType));

export const trackSearch = (query, mediaType, resultCount) =>
  addEventToCleverTap("Search Performed", {
    "Search Query": query,
    "Content Type": mediaType === "tv" ? "series" : "movie",
    Results: resultCount,
  });

export const trackTrailerPlayed = (item, mediaType) =>
  addEventToCleverTap("Trailer Played", titleProps(item, mediaType));

export const trackWatchlistAdded = (item, mediaType) => {
  addEventToCleverTap("Added to Watchlist", titleProps(item, mediaType));
  pushProfileCommand({ Site: { watchlist: { $add: titleOf(item) } } });
};

export const trackWatchlistRemoved = (item, mediaType) => {
  addEventToCleverTap("Removed from Watchlist", titleProps(item, mediaType));
  pushProfileCommand({ Site: { watchlist: { $remove: titleOf(item) } } });
};

/* ---------------------------- booking funnel ---------------------------- */

export const trackShowtimesViewed = ({ item, mediaType, cityName, dateKey, showCount }) =>
  addEventToCleverTap("Showtimes Viewed", {
    ...titleProps(item, mediaType),
    City: cityName,
    "Show Date": dateKey,
    "Shows Available": showCount,
  });

export const trackShowSelected = ({ item, mediaType, show }) =>
  addEventToCleverTap("Showtime Selected", {
    ...titleProps(item, mediaType),
    ...showProps(show),
    "From Price": show.fromPrice,
  });

export const trackSeatsSelected = ({ item, mediaType, show, seats, total }) =>
  addEventToCleverTap("Seats Selected", {
    ...titleProps(item, mediaType),
    ...showProps(show),
    Seats: seats.map((s) => s.id).join(", "),
    "Seat Count": seats.length,
    "Seat Types": [...new Set(seats.map((s) => s.tierKey))].join(", "),
    "Ticket Total": total,
  });

export const trackPassSelected = ({ item, option, quality }) =>
  addEventToCleverTap("Pass Selected", {
    ...titleProps(item, "tv"),
    "Pass Type": option.kindLabel,
    "Pass Label": option.label,
    Quality: quality.label,
    Price: option.price,
  });

export const trackCheckoutStarted = ({ item, mediaType, draft, totals }) =>
  addEventToCleverTap("Checkout Started", {
    ...titleProps(item, mediaType),
    "Booking Kind": draft.kind === "cinema" ? "tickets" : "streaming pass",
    Quantity: draft.kind === "cinema" ? draft.seats.length : 1,
    "Order Value": totals.total,
    ...(draft.kind === "cinema" ? showProps(draft.show) : { "Pass Label": draft.pass.label }),
  });

export const trackPaymentMethodSelected = (method) =>
  addEventToCleverTap("Payment Method Selected", { Method: method.label });

/** The revenue event - `Charged` is special-cased by CleverTap. */
export const trackCharged = (booking) => {
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
    "Content Title": booking.title.name,
    "Content ID": booking.title.id,
    ...(isCinema
      ? {
          "Cinema Name": booking.cinema.cinemaName,
          "Show Date": booking.cinema.dateKey,
          "Show Time": formatTime(booking.cinema.time),
          "Seat Count": booking.cinema.seats.length,
        }
      : {}),
  });
};

export const trackBookingCancelled = (booking) =>
  addEventToCleverTap("Booking Cancelled", {
    "Booking ID": booking.id,
    "Content Title": booking.title.name,
    "Booking Kind": booking.kind === "cinema" ? "tickets" : "streaming pass",
    "Refund Amount": booking.amount.total,
    ...(booking.kind === "cinema"
      ? { "Show Date": booking.cinema.dateKey, Cinema: booking.cinema.cinemaName }
      : {}),
  });

export const trackCityChanged = (city) => addEventToCleverTap("City Changed", { City: city });
