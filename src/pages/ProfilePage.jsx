import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import Select from "../components/ui/Select";
import Combobox from "../components/ui/Combobox";
import Badge from "../components/ui/Badge";
import { IconLogout, IconTicket, IconHeart, IconCheck, IconSparkle } from "../components/ui/Icons";
import { useAuth } from "../context/auth-context";
import { useBooking } from "../context/booking-context";
import { formatMoney } from "../lib/format";
import { cityName, CITIES } from "../lib/venues";
import { LANGUAGES_CATALOG } from "../lib/languages";
import { searchPerson, profileUrl } from "../lib/tmdb";
import { trackPageView, trackPreferencesSaved } from "../lib/analytics";
import { useScrollTop } from "../hooks/useScrollTop";

const PHONE_RE = /^\+91[0-9]{10}$/;

const GENRES = [
  "Action", "Comedy", "Drama", "Thriller", "Science Fiction",
  "Horror", "Romance", "Animation", "Documentary", "Crime", "Family",
];

const LANGUAGE_OPTIONS = LANGUAGES_CATALOG.map((l) => ({
  value: l.code,
  label: l.label,
  detail: l.native,
}));

const emptyForm = (profile, identity) => ({
  Name: profile.Name || "",
  Email: profile.Email || identity || "",
  Phone: profile.Phone || "",
  FavGenre: profile.FavGenre || "",
  FavDirector: profile.FavDirector || "",
  FavDirectorId: profile.FavDirectorId || null,
  FavLanguage: profile.FavLanguage || "",
  FavLanguageCode: profile.FavLanguageCode || null,
  _favDirectorImage: profile._favDirectorImage || null,
});

export default function ProfilePage() {
  const { identity, profile, updateProfile, logout } = useAuth();
  const { bookings, watchlist, city, setCity } = useBooking();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(() => emptyForm(profile, identity));

  useScrollTop("profile");

  useEffect(() => {
    trackPageView("Profile");
  }, []);

  // Re-sync when the stored profile changes underneath (e.g. after checkout).
  useEffect(() => {
    setForm(emptyForm(profile, identity));
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

  /* --------------------------- taste preferences --------------------------- */

  // TMDB people search, with directors floated to the top of the list - the
  // same query also returns actors, who are rarely what's wanted here.
  const loadDirectors = useCallback(async (query, signal) => {
    const data = await searchPerson(query, signal);
    return (data.results || [])
      .sort((a, b) => {
        const aDirects = a.known_for_department === "Directing" ? 1 : 0;
        const bDirects = b.known_for_department === "Directing" ? 1 : 0;
        return bDirects - aDirects || (b.popularity || 0) - (a.popularity || 0);
      })
      .slice(0, 12)
      .map((person) => ({
        value: String(person.id),
        label: person.name,
        detail:
          (person.known_for || [])
            .map((k) => k.title || k.name)
            .filter(Boolean)
            .slice(0, 2)
            .join(" · ") || person.known_for_department,
        image: profileUrl(person.profile_path),
        meta: person,
      }));
  }, []);

  const directorValue = form.FavDirector
    ? {
        label: form.FavDirector,
        detail: form.FavDirectorId ? "Matched on TMDB" : "Your own entry",
        // Only show an avatar when we actually have one.
        ...(form._favDirectorImage ? { image: form._favDirectorImage } : {}),
      }
    : null;

  const languageValue = form.FavLanguage
    ? {
        label: form.FavLanguage,
        detail: form.FavLanguageCode
          ? LANGUAGES_CATALOG.find((l) => l.code === form.FavLanguageCode)?.native
          : "Your own entry",
      }
    : null;

  const onDirectorChange = (option) => {
    if (!option) {
      setForm((f) => ({ ...f, FavDirector: "", FavDirectorId: null, _favDirectorImage: null }));
      return;
    }
    setForm((f) => ({
      ...f,
      FavDirector: option.label,
      FavDirectorId: option.custom ? null : Number(option.value),
      _favDirectorImage: option.custom ? null : option.image,
    }));
  };

  const onLanguageChange = (option) => {
    if (!option) {
      setForm((f) => ({ ...f, FavLanguage: "", FavLanguageCode: null }));
      return;
    }
    setForm((f) => ({
      ...f,
      FavLanguage: option.label,
      FavLanguageCode: option.custom ? null : option.value,
    }));
  };

  /* -------------------------------- actions -------------------------------- */

  const save = () => {
    if (phoneError) return;
    updateProfile(form);
    trackPreferencesSaved(form);
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

        <Field label="Name" value={form.Name} onChange={(v) => setForm((f) => ({ ...f, Name: v }))} />
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
          <span className="mb-2 block text-sm font-medium text-ink-200">Preferred city</span>
          <Select
            fullWidth
            label="Preferred city"
            value={city}
            onChange={(nextId) => {
              const next = CITIES.find((c) => c.id === nextId);
              if (next) setCity(next.id, next.name);
            }}
            options={CITIES.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
      </section>

      <section className="surface space-y-5 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-300 to-brand-500 text-ink-950">
            <IconSparkle size={17} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-white">Your taste</h2>
            <p className="text-xs text-ink-500">
              These become user properties, and drive the personalised rails on every title page.
            </p>
          </div>
        </div>

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
          <span className="mb-2 block text-sm font-medium text-ink-200">Favourite director</span>
          <Combobox
            label="Favourite director"
            placeholder="Search directors — try Nolan, Kashyap, Villeneuve…"
            value={directorValue}
            onChange={onDirectorChange}
            loadOptions={loadDirectors}
            allowCustom
            emptyText="No one matched — you can still save what you typed."
          />
          <p className="mt-1.5 text-xs text-ink-500">
            Saved as <code className="text-ink-400">FavDirector</code>
            {form.FavDirectorId ? (
              <>
                {" "}and <code className="text-ink-400">FavDirectorId</code>
              </>
            ) : null}
            .
          </p>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-ink-200">Preferred language</span>
          <Combobox
            label="Preferred language"
            placeholder="Search languages — Hindi, Tamil, Korean…"
            value={languageValue}
            onChange={onLanguageChange}
            options={LANGUAGE_OPTIONS}
            allowCustom
            minChars={0}
            emptyText="Not in the list — you can still save what you typed."
          />
          <p className="mt-1.5 text-xs text-ink-500">
            Saved as <code className="text-ink-400">FavLanguage</code>
            {form.FavLanguageCode ? (
              <>
                {" "}and <code className="text-ink-400">FavLanguageCode</code>
              </>
            ) : null}
            .
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
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
