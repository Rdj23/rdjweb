import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import HeroCarousel from "../components/catalog/HeroCarousel";
import TitleRail from "../components/catalog/TitleRail";
import { ErrorState } from "../components/ui/States";
import { useTmdb } from "../hooks/useTmdb";
import { getList, getTrending } from "../lib/tmdb";
import { trackPageView } from "../lib/analytics";
import { useBooking } from "../context/booking-context";
import { cityName } from "../lib/venues";
import { IconChevronRight } from "../components/ui/Icons";

const SeeAll = ({ to }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-0.5 text-sm font-semibold text-ink-400 transition-colors hover:text-brand-300"
  >
    See all
    <IconChevronRight size={15} />
  </Link>
);

export default function HomePage() {
  const { city } = useBooking();

  useEffect(() => {
    trackPageView("Home", { City: cityName(city) });
  }, [city]);

  const nowShowing = useTmdb((signal) => getList("movie/now_playing", { region: "IN" }, signal), []);
  const trendingMovies = useTmdb((signal) => getTrending("movie", signal), []);
  const topSeries = useTmdb((signal) => getList("tv/top_rated", {}, signal), []);
  const trendingSeries = useTmdb((signal) => getTrending("tv", signal), []);
  const upcoming = useTmdb((signal) => getList("movie/upcoming", { region: "IN" }, signal), []);

  if (nowShowing.error && !nowShowing.loading) {
    return <ErrorState message={nowShowing.error.message} onRetry={nowShowing.reload} />;
  }

  return (
    <div className="space-y-12">
      {/* CleverTap in-app / native display slots. Kept empty until a campaign
          injects into them, so they take no vertical space otherwise. */}
      <div id="ct-custom-popup-slot" />
      <div id="ct-native-banner-slot" />

      <HeroCarousel
        items={nowShowing.data?.results || []}
        mediaType="movie"
        loading={nowShowing.loading}
      />

      <TitleRail
        title="Now showing near you"
        subtitle={`Book seats at cinemas in ${cityName(city)}`}
        items={nowShowing.data?.results || []}
        mediaType="movie"
        loading={nowShowing.loading}
        action={<SeeAll to="/movies" />}
      />

      <TitleRail
        title="Trending series"
        subtitle="Stream with a season or complete-series pass"
        items={trendingSeries.data?.results || []}
        mediaType="tv"
        loading={trendingSeries.loading}
        action={<SeeAll to="/series" />}
      />

      <TitleRail
        title="Trending this week"
        items={trendingMovies.data?.results || []}
        mediaType="movie"
        loading={trendingMovies.loading}
        action={<SeeAll to="/movies" />}
      />

      <TitleRail
        title="Top rated series"
        items={topSeries.data?.results || []}
        mediaType="tv"
        loading={topSeries.loading}
        action={<SeeAll to="/series" />}
      />

      <TitleRail
        title="Coming soon"
        subtitle="Advance booking opens closer to release"
        items={upcoming.data?.results || []}
        mediaType="movie"
        loading={upcoming.loading}
      />
    </div>
  );
}
