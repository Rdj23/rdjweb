import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import Badge from "../components/ui/Badge";
import { IconLogout, IconTicket, IconHeart, IconCheck } from "../components/ui/Icons";
import { useAuth } from "../context/auth-context";
import { useBooking } from "../context/booking-context";
import { formatMoney } from "../lib/format";
import { cityName, CITIES } from "../lib/venues";
import { trackPageView } from "../lib/analytics";
import { useScrollTop } from "../hooks/useScrollTop";

const PHONE_RE = /^\+91[0-9]{10}$/;

const GENRES = [
  "Action", "Comedy", "Drama", "Thriller", "Sci-Fi",
  "Horror", "Romance", "Animation", "Documentary",
];

export default function ProfilePage() {
  const { identity, profile, updateProfile, logout } = useAuth();
  const { bookings, watchlist, city, setCity } = useBooking();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    Name: profile.Name || "",
    Email: profile.Email || identity || "",
    Phone: profile.Phone || "",
    FavGenre: profile.FavGenre || "",
  });

  useScrollTop("profile");

  useEffect(() => {
    trackPageView("Profile");
  }, []);

  // Re-sync when the stored profile changes underneath (e.g. after checkout).
  useEffect(() => {
    setForm({
      Name: profile.Name || "",
      Email: profile.Email || identity || "",
      Phone: profile.Phone || "",
      FavGenre: profile.FavGenre || "",
    });
  }, [profile, identity]);

  const phoneError = form.Phone && !PHONE_RE.test(form.Phone) ? "Use the format +919876543210" : null;

  const stats = useMemo(() => {
    const active = bookings.filter((b) => b.status !== "cancelled");
    return {
      bookings: active.length,
      spent: active.reduce((sum, b) => sum + b.amount.total, 0),
      watchlist: watchlist.length,
    };
  }, [bookings, watchlist]);

  const save = () => {
    if (phoneError) return;
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const signOut = () => {
    logout();
    navigate("/", { replace: true });
  };

  const initial = (form.Name || identity || "?").trim()[0]?.toUpperCase() || "?";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="surface flex items-center gap-4 p-5">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-500 text-2xl font-black text-ink-950">
          {initial}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-black text-white">{form.Name || "Your profile"}</h1>
          <p className="truncate text-sm text-ink-400">{identity}</p>
          <div className="mt-1.5">
            <Badge tone="brand">{cityName(city)}</Badge>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={IconTicket} label="Bookings" value={stats.bookings} to="/bookings" />
        <Stat label="Spent" value={formatMoney(stats.spent)} />
        <Stat icon={IconHeart} label="Watchlist" value={stats.watchlist} to="/watchlist" />
      </div>

      <section className="surface space-y-4 p-5">
        <h2 className="text-base font-semibold text-white">Your details</h2>
        <p className="-mt-3 text-xs text-ink-500">
          Saving syncs these fields to your CleverTap profile.
        </p>

        <Field
          label="Name"
          value={form.Name}
          onChange={(v) => setForm((f) => ({ ...f, Name: v }))}
        />
        <Field
          label="Email"
          type="email"
          value={form.Email}
          onChange={(v) => setForm((f) => ({ ...f, Email: v }))}
        />
        <Field
          label="Mobile"
          type="tel"
          value={form.Phone}
          placeholder="+919876543210"
          hint="Optional"
          error={phoneError}
          onChange={(v) => setForm((f) => ({ ...f, Phone: v.replace(/[^0-9+]/g, "") }))}
        />

        <div>
          <span className="mb-2 block text-sm font-medium text-ink-200">Favourite genre</span>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => {
              const active = form.FavGenre === genre;
              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, FavGenre: active ? "" : genre }))}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "border-brand-400 bg-brand-400 text-ink-950"
                      : "border-ink-750 bg-ink-900 text-ink-300 hover:border-ink-600 hover:text-white"
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-ink-200">Preferred city</span>
          <select
            value={city}
            onChange={(e) => {
              const next = CITIES.find((c) => c.id === e.target.value);
              if (next) setCity(next.id, next.name);
            }}
            className="w-full rounded-xl border border-ink-750 bg-ink-900 px-3.5 py-2.5 text-sm text-ink-100 focus:border-brand-400/60"
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button onClick={save} disabled={Boolean(phoneError)}>
            {saved ? (
              <>
                <IconCheck size={16} />
                Saved
              </>
            ) : (
              "Save profile"
            )}
          </Button>
          <Button variant="ghost" onClick={signOut}>
            <IconLogout size={16} />
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, to }) {
  const content = (
    <>
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-500">
        {Icon && <Icon size={13} />}
        {label}
      </span>
      <span className="mt-1 block text-xl font-black text-white">{value}</span>
    </>
  );

  const className = "surface block p-4 transition-colors";
  return to ? (
    <Link to={to} className={`${className} hover:border-brand-400/40`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
