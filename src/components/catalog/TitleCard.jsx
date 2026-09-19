import React, { memo } from "react";
import { Link } from "react-router-dom";
import { posterUrl, posterSrcSet, titleOf, releaseDateOf } from "../../lib/tmdb";
import { yearOf } from "../../lib/format";
import { IconStar, IconTicket } from "../ui/Icons";

function TitleCardBase({ item, mediaType, priority = false }) {
  const name = titleOf(item);
  const year = yearOf(releaseDateOf(item));
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

  return (
    <Link
      to={`/title/${mediaType}/${item.id}`}
      className="group block focus:outline-none"
      aria-label={`${name}${year ? `, ${year}` : ""}`}
    >
      {/* Fixed aspect ratio reserves the space before the poster loads, so
          nothing below the card shifts when images arrive. */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-ink-800 bg-ink-850 shadow-lift transition-all duration-300 group-hover:border-brand-400/50 group-hover:shadow-glow group-focus-visible:border-brand-400">
        <img
          src={posterUrl(item.poster_path)}
          srcSet={posterSrcSet(item.poster_path)}
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 24vw, 200px"
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent opacity-80" />

        {rating && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-ink-950/80 px-1.5 py-1 text-[11px] font-bold text-brand-300 backdrop-blur-sm">
            <IconStar size={12} />
            {rating}
          </span>
        )}

        <span className="pointer-events-none absolute inset-x-2 bottom-2 flex translate-y-3 items-center justify-center gap-1.5 rounded-lg bg-brand-400 py-2 text-xs font-bold text-ink-950 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <IconTicket size={14} />
          {mediaType === "tv" ? "Get pass" : "Book tickets"}
        </span>
      </div>

      <div className="mt-2.5 space-y-0.5">
        <h3 className="truncate text-sm font-semibold text-ink-100 transition-colors group-hover:text-brand-300">
          {name}
        </h3>
        <p className="text-xs text-ink-400">
          {year || "TBA"}
          {mediaType === "tv" ? " · Series" : ""}
        </p>
      </div>
    </Link>
  );
}

// Grids re-render on every filter change; the cards themselves rarely change.
export default memo(TitleCardBase);
