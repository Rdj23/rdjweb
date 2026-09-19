import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DateStrip from "../components/booking/DateStrip";
import ShowtimeList from "../components/booking/ShowtimeList";
import CityPicker from "../components/booking/CityPicker";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/States";
import { IconChevronLeft, IconStar } from "../components/ui/Icons";
import { useTmdb } from "../hooks/useTmdb";
import { useScrollTop } from "../hooks/useScrollTop";
import { getTitleDetail, posterUrl, titleOf, releaseDateOf, runtimeOf, genreNames } from "../lib/tmdb";
import { formatRuntime, yearOf } from "../lib/format";
import { bookingDates, showsForTitle } from "../lib/shows";
import { useBooking } from "../context/booking-context";
import { cityName } from "../lib/venues";
import { trackShowtimesViewed, trackShowSelected } from "../lib/analytics";

export default function ShowtimesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { city } = useBooking();
  const dates = useMemo(() => bookingDates(), []);
  const [dateKey, setDateKey] = useState(dates[0]);

  useScrollTop(id);

  // Cached from the detail page in the common case, so this is usually free.
  const { data: item, loading, error, reload } = useTmdb(
    (signal) => getTitleDetail("movie", id, signal),
    [id]
  );

  const venues = useMemo(
    () => showsForTitle({ titleId: id, cityId: city, dateKey }),
    [id, city, dateKey]
  );

  const showCount = useMemo(
    () => venues.reduce((sum, v) => sum + v.shows.length, 0),
    [venues]
  );

  useEffect(() => {
    if (!item?.id) return;
    trackShowtimesViewed({ item, mediaType: "movie", cityId: city, dateKey, showCount });
  }, [item, city, dateKey, showCount]);

  const handleSelect = (show) => {
    if (item?.id) trackShowSelected({ item, mediaType: "movie", show, cityId: city });
    navigate(`/book/movie/${id}/seats/${show.id}`);
  };

  if (error) return <ErrorState message={error.message} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <Link
        to={`/title/movie/${id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-400 transition-colors hover:text-brand-300"
      >
        <IconChevronLeft size={16} />
        Back to title
      </Link>

      <header className="surface flex items-center gap-4 p-4">
        {loading ? (
          <>
            <Skeleton className="h-24 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </>
        ) : (
          <>
            <img
              src={posterUrl(item.poster_path, "w185")}
              alt=""
              className="h-24 w-16 shrink-0 rounded-lg border border-ink-800 object-cover"
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-white sm:text-2xl">{titleOf(item)}</h1>
              <p className="mt-1 truncate text-sm text-ink-400">
                {[yearOf(releaseDateOf(item)), formatRuntime(runtimeOf(item)), genreNames(item).slice(0, 3).join(", ")]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {item.vote_average > 0 && (
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand-300">
                  <IconStar size={13} />
                  {item.vote_average.toFixed(1)}
                </p>
              )}
            </div>
          </>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">
          Showtimes in <span className="text-brand-400">{cityName(city)}</span>
        </h2>
        <div className="rounded-lg border border-ink-750 bg-ink-850">
          <CityPicker />
        </div>
      </div>

      <DateStrip dates={dates} value={dateKey} onChange={setDateKey} />

      <p className="text-xs text-ink-500">
        {showCount} show{showCount === 1 ? "" : "s"} across {venues.length} cinema
        {venues.length === 1 ? "" : "s"}
      </p>

      <ShowtimeList venues={venues} onSelect={handleSelect} />
    </div>
  );
}
