import React, { useState } from "react";
import { IconPlay } from "../ui/Icons";

/**
 * Facade-loaded trailer.
 *
 * A YouTube embed pulls several hundred KB of player JavaScript, and most
 * visitors to a detail page never press play - so we show YouTube's own
 * thumbnail and only mount the iframe on the first click.
 */
export default function TrailerPlayer({ videoKey, title, onPlay }) {
  const [playing, setPlaying] = useState(false);

  if (!videoKey) {
    return (
      <div className="surface grid h-40 place-items-center text-sm text-ink-500">
        No trailer available for this title.
      </div>
    );
  }

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => {
          setPlaying(true);
          onPlay?.();
        }}
        aria-label={`Play trailer for ${title}`}
        className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-ink-800"
      >
        <img
          src={`https://i.ytimg.com/vi/${videoKey}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute inset-0 bg-ink-950/40 transition-colors group-hover:bg-ink-950/25" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-400 pl-1 text-ink-950 shadow-glow transition-transform duration-300 group-hover:scale-110">
            <IconPlay size={28} />
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl border border-ink-800">
      <iframe
        title={`${title} trailer`}
        src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
