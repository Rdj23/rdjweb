import React from "react";
import { Link } from "react-router-dom";
import { IconTicket } from "../ui/Icons";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-ink-850 bg-ink-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-400 text-ink-950">
              <IconTicket size={16} />
            </span>
            <span className="text-base font-black text-white">
              Cine<span className="text-brand-400">plex</span>
            </span>
          </Link>
          <p className="max-w-md text-xs leading-relaxed text-ink-500">
            A demo booking experience. Cinemas, showtimes, seat availability and payments are
            simulated in the browser; catalog data comes from TMDB.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-400">
          <Link to="/movies" className="hover:text-brand-300">Movies</Link>
          <Link to="/series" className="hover:text-brand-300">Series</Link>
          <Link to="/bookings" className="hover:text-brand-300">My bookings</Link>
          <Link to="/watchlist" className="hover:text-brand-300">Watchlist</Link>
        </div>
      </div>
      <div className="border-t border-ink-850 px-4 py-4 text-center text-xs text-ink-600">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </div>
    </footer>
  );
}
