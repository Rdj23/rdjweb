import React, { useRef } from "react";
import TitleCard from "./TitleCard";
import { PosterCardSkeleton } from "../ui/Skeleton";
import { IconChevronLeft, IconChevronRight } from "../ui/Icons";

/** Horizontally scrolling row of posters with desktop arrow controls. */
export default function TitleRail({ title, subtitle, items, mediaType, loading, action }) {
  const railRef = useRef(null);

  const scrollBy = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <div className="hidden gap-1.5 md:flex">
            {[-1, 1].map((direction) => (
              <button
                key={direction}
                type="button"
                onClick={() => scrollBy(direction)}
                aria-label={direction < 0 ? "Scroll left" : "Scroll right"}
                className="grid h-9 w-9 place-items-center rounded-full border border-ink-700 bg-ink-850 text-ink-300 transition-colors hover:border-brand-400/50 hover:text-brand-300"
              >
                {direction < 0 ? <IconChevronLeft size={18} /> : <IconChevronRight size={18} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto scroll-smooth px-1 pb-2"
      >
        {loading
          ? Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="w-[150px] shrink-0 sm:w-[170px]">
                <PosterCardSkeleton />
              </div>
            ))
          : items.map((item, index) => (
              <div key={item.id} className="w-[150px] shrink-0 sm:w-[170px]">
                <TitleCard item={item} mediaType={mediaType} priority={index < 3} />
              </div>
            ))}
      </div>
    </section>
  );
}
