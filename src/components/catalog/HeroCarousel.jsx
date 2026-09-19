import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { imageUrl, posterUrl, titleOf, releaseDateOf } from "../../lib/tmdb";
import { yearOf } from "../../lib/format";
import { IconStar, IconTicket } from "../ui/Icons";
import Button from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";

const ROTATE_MS = 7000;

export default function HeroCarousel({ items = [], mediaType, loading }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slides = items.slice(0, 5);
  const slideCount = slides.length;
  const timer = useRef(null);

  // Reset when the underlying list changes (e.g. Movies -> Series).
  useEffect(() => setIndex(0), [mediaType, slideCount]);

  useEffect(() => {
    if (paused || slideCount < 2) return undefined;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % slideCount), ROTATE_MS);
    return () => clearInterval(timer.current);
  }, [paused, slideCount]);

  if (loading || !slideCount) {
    return <Skeleton className="h-[340px] w-full rounded-3xl sm:h-[420px]" />;
  }

  const active = slides[index];
  const name = titleOf(active);
  const year = yearOf(releaseDateOf(active));

  return (
    <section
      className="relative h-[380px] overflow-hidden rounded-3xl border border-ink-800 sm:h-[440px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured titles"
    >
      {slides.map((slide, i) => (
        <img
          key={slide.id}
          src={imageUrl(slide.backdrop_path, "w1280") || posterUrl(slide.poster_path, "w780")}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "low"}
          decoding="async"
          aria-hidden={i !== index}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />

      <div className="relative flex h-full flex-col justify-end gap-4 p-6 sm:max-w-2xl sm:p-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-300">
          <span className="rounded-md bg-brand-400/15 px-2 py-1 text-brand-300">
            {mediaType === "tv" ? "Trending series" : "In cinemas now"}
          </span>
          {active.vote_average > 0 && (
            <span className="inline-flex items-center gap-1 text-brand-300">
              <IconStar size={13} />
              {active.vote_average.toFixed(1)}
            </span>
          )}
          {year && <span>{year}</span>}
        </div>

        <h1 className="text-3xl font-black leading-tight text-white drop-shadow sm:text-5xl">
          {name}
        </h1>

        <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-ink-300 sm:text-base">
          {active.overview}
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <Button to={`/title/${mediaType}/${active.id}`} size="lg">
            <IconTicket size={18} />
            {mediaType === "tv" ? "Get a pass" : "Book tickets"}
          </Button>
          <Button to={`/title/${mediaType}/${active.id}`} variant="secondary" size="lg">
            More details
          </Button>
        </div>
      </div>

      {slideCount > 1 && (
        <div className="absolute bottom-5 right-6 flex gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show ${titleOf(slide)}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-7 bg-brand-400" : "w-3 bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}

      <Link
        to={`/title/${mediaType}/${active.id}`}
        className="absolute inset-0 sm:hidden"
        aria-label={`Open ${name}`}
      />
    </section>
  );
}
