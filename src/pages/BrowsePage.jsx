import React, { useEffect, useMemo, useState } from "react";
import TitleCard from "../components/catalog/TitleCard";
import { PosterGridSkeleton } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/States";
import { useTmdb } from "../hooks/useTmdb";
import { useScrollTop } from "../hooks/useScrollTop";
import { getList } from "../lib/tmdb";
import { trackPageView } from "../lib/analytics";

// Curated shelves per media type. TMDB splits its catalog endpoints between
// movie/* and tv/*, so the two lists can't be shared.
const COLLECTIONS = {
  movie: [
    { key: "now", label: "Now showing", path: "movie/now_playing", params: { region: "IN" } },
    { key: "popular", label: "Popular", path: "movie/popular" },
    { key: "top", label: "Top rated", path: "movie/top_rated" },
    { key: "upcoming", label: "Coming soon", path: "movie/upcoming", params: { region: "IN" } },
    { key: "action", label: "Action", path: "discover/movie", params: { with_genres: "28", sort_by: "popularity.desc" } },
    { key: "comedy", label: "Comedy", path: "discover/movie", params: { with_genres: "35", sort_by: "popularity.desc" } },
    { key: "horror", label: "Horror", path: "discover/movie", params: { with_genres: "27", sort_by: "popularity.desc" } },
    { key: "anime", label: "Animation", path: "discover/movie", params: { with_genres: "16", sort_by: "popularity.desc" } },
    { key: "hindi", label: "Hindi", path: "discover/movie", params: { with_original_language: "hi", sort_by: "popularity.desc" } },
  ],
  tv: [
    { key: "popular", label: "Popular", path: "tv/popular" },
    { key: "top", label: "Top rated", path: "tv/top_rated" },
    { key: "airing", label: "Airing today", path: "tv/airing_today" },
    { key: "onair", label: "On the air", path: "tv/on_the_air" },
    { key: "drama", label: "Drama", path: "discover/tv", params: { with_genres: "18", sort_by: "popularity.desc" } },
    { key: "crime", label: "Crime", path: "discover/tv", params: { with_genres: "80", sort_by: "popularity.desc" } },
    { key: "anime", label: "Animation", path: "discover/tv", params: { with_genres: "16", sort_by: "popularity.desc" } },
    { key: "docs", label: "Documentary", path: "discover/tv", params: { with_genres: "99", sort_by: "popularity.desc" } },
  ],
};

export default function BrowsePage({ mediaType }) {
  const collections = COLLECTIONS[mediaType];
  const [activeKey, setActiveKey] = useState(collections[0].key);
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState([]);

  useScrollTop(mediaType);

  // Switching media type re-mounts nothing, so reset the shelf explicitly.
  useEffect(() => {
    setActiveKey(collections[0].key);
    setPage(1);
    setAccumulated([]);
  }, [mediaType, collections]);

  useEffect(() => {
    trackPageView(mediaType === "tv" ? "Browse Series" : "Browse Movies");
  }, [mediaType]);

  const active = useMemo(
    () => collections.find((c) => c.key === activeKey) || collections[0],
    [collections, activeKey]
  );

  const { data, loading, error, reload } = useTmdb(
    (signal) => getList(active.path, { ...(active.params || {}), page: String(page) }, signal),
    [active.path, JSON.stringify(active.params), page, mediaType]
  );

  // Append each new page rather than replacing, so "Load more" grows the grid.
  useEffect(() => {
    if (!data?.results) return;
    setAccumulated((prev) => {
      if (page === 1) return data.results;
      const seen = new Set(prev.map((i) => i.id));
      return [...prev, ...data.results.filter((i) => !seen.has(i.id))];
    });
  }, [data, page]);

  const selectCollection = (key) => {
    setActiveKey(key);
    setPage(1);
    setAccumulated([]);
  };

  const hasMore = data && page < Math.min(data.total_pages || 1, 20);
  const showingSkeleton = loading && accumulated.length === 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          {mediaType === "tv" ? "Series" : "Movies"}
        </h1>
        <p className="text-sm text-ink-400">
          {mediaType === "tv"
            ? "Buy a season or complete-series pass and start streaming."
            : "Pick a title, then choose your cinema, showtime and seats."}
        </p>
      </header>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {collections.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => selectCollection(c.key)}
            aria-pressed={c.key === activeKey}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              c.key === activeKey
                ? "bg-brand-400 text-ink-950"
                : "border border-ink-750 bg-ink-850 text-ink-300 hover:border-ink-600 hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && accumulated.length === 0 ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : showingSkeleton ? (
        <PosterGridSkeleton count={18} />
      ) : accumulated.length === 0 ? (
        <EmptyState title="Nothing here yet" description="This shelf came back empty." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {accumulated.map((item, index) => (
              <TitleCard key={item.id} item={item} mediaType={mediaType} priority={index < 6} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="rounded-xl border border-ink-700 bg-ink-850 px-6 py-3 text-sm font-semibold text-ink-200 transition-colors hover:border-brand-400/50 hover:text-brand-300 disabled:opacity-50"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
