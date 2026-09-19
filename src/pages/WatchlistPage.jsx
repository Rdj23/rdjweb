import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { EmptyState } from "../components/ui/States";
import { IconHeart, IconStar, IconTicket } from "../components/ui/Icons";
import { posterUrl } from "../lib/tmdb";
import { useBooking } from "../context/booking-context";
import { trackPageView, trackWatchlistRemoved } from "../lib/analytics";
import { useScrollTop } from "../hooks/useScrollTop";

export default function WatchlistPage() {
  const { watchlist, toggleWatchlist } = useBooking();
  useScrollTop("watchlist");

  useEffect(() => {
    trackPageView("Watchlist", { "Watchlist Size": watchlist.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (watchlist.length === 0) {
    return (
      <EmptyState
        icon={IconHeart}
        title="Your watchlist is empty"
        description="Tap the heart on any movie or series to keep it here for later."
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

  const remove = (entry) => {
    toggleWatchlist(entry);
    // The stored entry is a slim snapshot; the tracker only needs id + name.
    trackWatchlistRemoved({ id: entry.id, name: entry.name, title: entry.name }, entry.mediaType);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Watchlist</h1>
        <p className="mt-1 text-sm text-ink-400">
          {watchlist.length} title{watchlist.length === 1 ? "" : "s"} saved
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {watchlist.map((entry) => (
          <div
            key={`${entry.mediaType}-${entry.id}`}
            className="surface flex items-center gap-4 p-3"
          >
            <Link to={`/title/${entry.mediaType}/${entry.id}`} className="shrink-0">
              <img
                src={posterUrl(entry.posterPath, "w185")}
                alt=""
                loading="lazy"
                className="h-24 w-16 rounded-lg border border-ink-800 object-cover"
              />
            </Link>

            <div className="min-w-0 flex-1 space-y-1.5">
              <Link
                to={`/title/${entry.mediaType}/${entry.id}`}
                className="block truncate font-semibold text-white hover:text-brand-300"
              >
                {entry.name}
              </Link>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
                <Badge tone="muted">{entry.mediaType === "tv" ? "Series" : "Movie"}</Badge>
                {entry.year && <span>{entry.year}</span>}
                {entry.voteAverage > 0 && (
                  <span className="inline-flex items-center gap-1 font-bold text-brand-300">
                    <IconStar size={11} />
                    {entry.voteAverage.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <Button
                  size="sm"
                  to={
                    entry.mediaType === "tv"
                      ? `/book/tv/${entry.id}/pass`
                      : `/book/movie/${entry.id}/shows`
                  }
                >
                  <IconTicket size={13} />
                  {entry.mediaType === "tv" ? "Get pass" : "Book"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(entry)}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
