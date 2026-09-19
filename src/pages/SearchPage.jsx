import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TitleCard from "../components/catalog/TitleCard";
import { PosterGridSkeleton } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/States";
import { useTmdb, useDebounced } from "../hooks/useTmdb";
import { search } from "../lib/tmdb";
import { trackSearch, trackPageView } from "../lib/analytics";
import { IconSearch } from "../components/ui/Icons";

const TABS = [
  { key: "movie", label: "Movies" },
  { key: "tv", label: "Series" },
];

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const [mediaType, setMediaType] = useState("movie");
  const debouncedQuery = useDebounced(query, 300);

  useEffect(() => {
    trackPageView("Search", { "Search Query": query });
  }, [query]);

  const { data, loading, error, reload } = useTmdb(
    (signal) => search(mediaType, debouncedQuery, signal),
    [mediaType, debouncedQuery],
    { enabled: debouncedQuery.trim().length > 1 }
  );

  // Report the search once results land, so the event carries a result count.
  useEffect(() => {
    if (data?.results && debouncedQuery.trim().length > 1) {
      trackSearch(debouncedQuery, mediaType, data.results.length);
    }
  }, [data, debouncedQuery, mediaType]);

  const results = data?.results || [];

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          {query ? (
            <>
              Results for <span className="text-brand-400">“{query}”</span>
            </>
          ) : (
            "Search"
          )}
        </h1>

        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMediaType(tab.key)}
              aria-pressed={mediaType === tab.key}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mediaType === tab.key
                  ? "bg-brand-400 text-ink-950"
                  : "border border-ink-750 bg-ink-850 text-ink-300 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {!query.trim() ? (
        <EmptyState
          icon={IconSearch}
          title="What are you looking for?"
          description="Search by title to find a movie to book or a series to stream. Press / anywhere to jump to the search box."
        />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : loading ? (
        <PosterGridSkeleton count={12} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={IconSearch}
          title={`No ${mediaType === "tv" ? "series" : "movies"} matched “${query}”`}
          description="Check the spelling, or try the other tab."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {results.map((item, index) => (
            <TitleCard key={item.id} item={item} mediaType={mediaType} priority={index < 6} />
          ))}
        </div>
      )}
    </div>
  );
}
