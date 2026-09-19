import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth-context";
import { useBooking } from "../../context/booking-context";
import CityPicker from "../booking/CityPicker";
import { IconSearch, IconTicket, IconHeart, IconFilm } from "../ui/Icons";

const navLinks = [
  { to: "/movies", label: "Movies", icon: IconFilm },
  { to: "/series", label: "Series", icon: IconFilm },
  { to: "/bookings", label: "My bookings", icon: IconTicket },
  { to: "/watchlist", label: "Watchlist", icon: IconHeart },
];

export default function Topbar() {
  const { identity, profile, isAuthenticated } = useAuth();
  const { bookings, watchlist } = useBooking();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef(null);

  const activeBookings = bookings.filter((b) => b.status !== "cancelled").length;

  // Solid background once the page scrolls, so the hero can sit behind a
  // transparent bar at the top without hurting legibility further down.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Clear the field when the user navigates away from search results.
  useEffect(() => {
    if (!location.pathname.startsWith("/search")) setQuery("");
  }, [location.pathname]);

  // "/" focuses search, the way most catalog apps behave.
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const initial = (profile.Name || identity || "?").trim()[0]?.toUpperCase() || "?";

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled ? "border-ink-800 bg-ink-950/90 backdrop-blur-xl" : "border-transparent bg-ink-950"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Cineplex home">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-400 text-ink-950">
            <IconTicket size={18} />
          </span>
          <span className="hidden text-lg font-black tracking-tight text-white sm:block">
            Cine<span className="text-brand-400">plex</span>
          </span>
        </Link>

        <CityPicker />

        <form onSubmit={submitSearch} className="relative min-w-0 flex-1" role="search">
          <IconSearch
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies and series"
            aria-label="Search movies and series"
            className="w-full rounded-full border border-ink-750 bg-ink-850 py-2.5 pl-10 pr-4 text-sm text-ink-100 placeholder:text-ink-400 transition-colors focus:border-brand-400/60 focus:bg-ink-800"
          />
        </form>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-brand-300" : "text-ink-300 hover:text-white"
                }`
              }
            >
              {label}
              {to === "/bookings" && activeBookings > 0 && (
                <span className="ml-1.5 rounded-full bg-brand-400 px-1.5 text-[10px] font-bold text-ink-950">
                  {activeBookings}
                </span>
              )}
              {to === "/watchlist" && watchlist.length > 0 && (
                <span className="ml-1.5 rounded-full bg-ink-700 px-1.5 text-[10px] font-bold text-ink-200">
                  {watchlist.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {isAuthenticated ? (
          <Link
            to="/profile"
            title={profile.Name || identity}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-500 text-sm font-bold text-ink-950 transition-transform hover:scale-105"
          >
            {initial}
          </Link>
        ) : (
          <Link
            to="/login"
            state={{ from: location.pathname + location.search }}
            className="shrink-0 rounded-xl bg-brand-400 px-4 py-2 text-sm font-bold text-ink-950 transition-colors hover:bg-brand-300"
          >
            Sign in
          </Link>
        )}
      </div>

      {/* Mobile nav - the same destinations, kept reachable without a drawer. */}
      <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-ink-850 px-4 py-2 lg:hidden">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                isActive ? "bg-brand-400/15 text-brand-300" : "text-ink-300 hover:text-white"
              }`
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
