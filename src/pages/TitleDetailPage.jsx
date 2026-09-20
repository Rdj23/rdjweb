import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import TrailerPlayer from "../components/catalog/TrailerPlayer";
import RecommendationSections from "../components/catalog/RecommendationSections";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { DetailSkeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/States";
import { IconStar, IconHeart, IconTicket, IconPin, IconClock } from "../components/ui/Icons";
import { useTmdb } from "../hooks/useTmdb";
import { useScrollTop } from "../hooks/useScrollTop";
import {
  getTitleDetail, findTrailer, imageUrl, posterUrl, profileUrl,
  titleOf, releaseDateOf, runtimeOf, genreNames,
} from "../lib/tmdb";
import { formatRuntime, yearOf, formatMoney } from "../lib/format";
import { useAuth } from "../context/auth-context";
import { useBooking } from "../context/booking-context";
import { cityName } from "../lib/venues";
import { showsForTitle, bookingDates } from "../lib/shows";
import { passPricing } from "../lib/passes";
import {
  trackContentViewed, trackTrailerPlayed, trackWatchlistAdded, trackWatchlistRemoved,
} from "../lib/analytics";

export default function TitleDetailPage() {
  const { type, id } = useParams();
  const mediaType = type === "tv" ? "tv" : "movie";
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { city, isWatchlisted, toggleWatchlist } = useBooking();

  useScrollTop(`${mediaType}-${id}`);

  const { data: item, loading, error, reload } = useTmdb(
    (signal) => getTitleDetail(mediaType, id, signal),
    [mediaType, id]
  );

  useEffect(() => {
    if (item?.id) trackContentViewed(item, mediaType);
  }, [item, mediaType]);

  // Cheapest ticket across today's shows in the selected city - the "from"
  // price shown next to the primary CTA.
  const fromPrice = useMemo(() => {
    if (mediaType !== "movie" || !item?.id) return null;
    const [today] = bookingDates(1);
    const venues = showsForTitle({ titleId: item.id, cityId: city, dateKey: today });
    const prices = venues.flatMap((v) => v.shows.map((s) => s.fromPrice));
    return prices.length ? Math.min(...prices) : null;
  }, [item, mediaType, city]);

  const passFrom = useMemo(() => {
    if (mediaType !== "tv" || !item?.id) return null;
    return passPricing({ seriesId: item.id, seasons: item.seasons || [] }).episodeBase;
  }, [item, mediaType]);

  const watchlisted = item ? isWatchlisted(item.id, mediaType) : false;

  const handleWatchlist = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    const added = toggleWatchlist({
      id: item.id,
      mediaType,
      name: titleOf(item),
      posterPath: item.poster_path,
      year: yearOf(releaseDateOf(item)),
      voteAverage: item.vote_average,
    });
    if (added) trackWatchlistAdded(item, mediaType);
    else trackWatchlistRemoved(item, mediaType);
  };

  const startBooking = () =>
    navigate(mediaType === "tv" ? `/book/tv/${item.id}/pass` : `/book/movie/${item.id}/shows`);

  if (loading) return <DetailSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!item?.id) return <ErrorState message="We couldn't find that title." />;

  const name = titleOf(item);
  const year = yearOf(releaseDateOf(item));
  const runtime = formatRuntime(runtimeOf(item));
  const genres = genreNames(item);
  const trailer = findTrailer(item);
  const cast = (item.credits?.cast || []).slice(0, 12);
  const director = (item.credits?.crew || []).find((c) => c.job === "Director");

  return (
    <div className="space-y-12">
      {/* Backdrop bleeds to the full viewport width behind the page container. */}
      <section className="relative -mx-4 -mt-6 overflow-hidden sm:-mx-6 lg:-mx-8">
        {item.backdrop_path && (
          <>
            <img
              src={imageUrl(item.backdrop_path, "w1280")}
              alt=""
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-top opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-950/60" />
          </>
        )}

        <div className="relative flex flex-col gap-7 px-4 py-8 sm:px-6 sm:py-12 md:flex-row lg:px-8">
          <img
            src={posterUrl(item.poster_path, "w500")}
            alt={`${name} poster`}
            fetchPriority="high"
            className="w-40 shrink-0 self-center rounded-2xl border border-ink-800 shadow-lift md:w-60 md:self-start"
          />

          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl">{name}</h1>
              {item.tagline && <p className="text-sm italic text-ink-400">{item.tagline}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-300">
              {item.vote_average > 0 && (
                <span className="inline-flex items-center gap-1.5 font-bold text-brand-300">
                  <IconStar size={15} />
                  {item.vote_average.toFixed(1)}
                  <span className="font-normal text-ink-500">({item.vote_count?.toLocaleString("en-IN")})</span>
                </span>
              )}
              {year && <span>{year}</span>}
              {runtime && (
                <span className="inline-flex items-center gap-1">
                  <IconClock size={14} />
                  {runtime}
                </span>
              )}
              {mediaType === "tv" && item.number_of_seasons > 0 && (
                <span>
                  {item.number_of_seasons} season{item.number_of_seasons > 1 ? "s" : ""} ·{" "}
                  {item.number_of_episodes} episodes
                </span>
              )}
              <Badge tone="muted">{mediaType === "tv" ? "Series" : "Movie"}</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <Badge key={g}>{g}</Badge>
              ))}
            </div>

            {item.overview && (
              <p className="max-w-3xl text-sm leading-relaxed text-ink-200 sm:text-base">
                {item.overview}
              </p>
            )}

            {director && (
              <p className="text-sm text-ink-400">
                Directed by <span className="font-medium text-ink-200">{director.name}</span>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" onClick={startBooking}>
                <IconTicket size={18} />
                {mediaType === "tv" ? "Get a pass" : "Book tickets"}
                {mediaType === "movie" && fromPrice ? ` · from ${formatMoney(fromPrice)}` : ""}
                {mediaType === "tv" && passFrom ? ` · from ${formatMoney(passFrom)}` : ""}
              </Button>

              <Button
                size="lg"
                variant={watchlisted ? "outline" : "secondary"}
                onClick={handleWatchlist}
                aria-pressed={watchlisted}
              >
                <IconHeart size={18} filled={watchlisted} />
                {watchlisted ? "In watchlist" : "Add to watchlist"}
              </Button>
            </div>

            {mediaType === "movie" && (
              <p className="inline-flex items-center gap-1.5 text-xs text-ink-500">
                <IconPin size={13} />
                Showing cinemas in {cityName(city)}
              </p>
            )}
          </div>
        </div>
      </section>

      {trailer && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Trailer</h2>
          <div className="max-w-3xl">
            <TrailerPlayer
              videoKey={trailer.key}
              title={name}
              onPlay={() => trackTrailerPlayed(item, mediaType)}
            />
          </div>
        </section>
      )}

      {cast.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Cast</h2>
          <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
            {cast.map((member) => (
              <div key={`${member.id}-${member.credit_id}`} className="w-28 shrink-0 text-center">
                <img
                  src={profileUrl(member.profile_path)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-[2/3] w-full rounded-xl border border-ink-800 object-cover"
                />
                <p className="mt-2 truncate text-xs font-semibold text-ink-100">{member.name}</p>
                <p className="truncate text-[11px] text-ink-500">{member.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <RecommendationSections item={item} mediaType={mediaType} />

      <p className="text-xs text-ink-600">
        Looking for something else?{" "}
        <Link to={mediaType === "tv" ? "/series" : "/movies"} className="text-brand-400 hover:underline">
          Browse all {mediaType === "tv" ? "series" : "movies"}
        </Link>
      </p>
    </div>
  );
}
