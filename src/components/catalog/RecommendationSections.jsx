import React, { useMemo } from "react";
import NativeSlot from "./NativeSlot";
import TitleCard from "./TitleCard";
import { PosterCardSkeleton } from "../ui/Skeleton";
import { IconSparkle, IconFilm, IconUser } from "../ui/Icons";
import { useTmdb } from "../../hooks/useTmdb";
import { getList, getPersonWorks, directorOf, profileUrl } from "../../lib/tmdb";
import { languageLabel, LANGUAGES_CATALOG } from "../../lib/languages";
import { useAuth } from "../../context/auth-context";

/**
 * Three CleverTap recommendation rails, one per personalisation dimension.
 *
 * Each rail owns a stable slot id that a native display campaign targets:
 *   #ct-reco-genre   #ct-reco-language   #ct-reco-director
 *
 * While a slot is empty the rail renders a TMDB-backed stand-in built from the
 * same basis the campaign would use, so the page reads correctly before any
 * campaign is live. The moment CleverTap injects, the stand-in steps aside.
 *
 * The basis for each rail prefers the viewer's saved preference and falls back
 * to the title's own attribute - so a signed-in user with a favourite director
 * sees "based on your favourite director", and everyone else still gets a
 * sensible rail off the title they are looking at.
 */
export default function RecommendationSections({ item, mediaType }) {
  const { profile } = useAuth();

  const basis = useMemo(() => {
    const titleGenre = (item.genres || [])[0];
    const titleDirector = directorOf(item, mediaType);
    const titleLanguageCode = item.original_language;

    const favLanguage = LANGUAGES_CATALOG.find((l) => l.code === profile.FavLanguageCode);

    return {
      genre: profile.FavGenre
        ? { label: profile.FavGenre, personal: true, id: null }
        : titleGenre
          ? { label: titleGenre.name, personal: false, id: titleGenre.id }
          : null,

      language: favLanguage
        ? { label: favLanguage.label, personal: true, code: favLanguage.code }
        : titleLanguageCode
          ? { label: languageLabel(titleLanguageCode), personal: false, code: titleLanguageCode }
          : null,

      director: profile.FavDirector
        ? {
            label: profile.FavDirector,
            personal: true,
            id: profile.FavDirectorId || null,
            image: profile._favDirectorImage || null,
          }
        : titleDirector
          ? {
              label: titleDirector.name,
              personal: false,
              id: titleDirector.id,
              image: profileUrl(titleDirector.profilePath),
            }
          : null,
    };
  }, [item, mediaType, profile]);

  // A genre name is only usable as a discover filter when we have its TMDB id,
  // which a free-text favourite doesn't carry - resolve it from the catalog.
  const genreQuery = useTmdb(
    (signal) => getList("genre/movie/list", {}, signal),
    [],
    { enabled: Boolean(basis.genre?.personal) }
  );

  const genreId = useMemo(() => {
    if (!basis.genre) return null;
    if (!basis.genre.personal) return basis.genre.id;
    const match = (genreQuery.data?.genres || []).find(
      (g) => g.name.toLowerCase() === basis.genre.label.toLowerCase()
    );
    return match?.id ?? null;
  }, [basis.genre, genreQuery.data]);

  return (
    <section className="space-y-8">
      <header className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-300 to-brand-500 text-ink-950">
          <IconSparkle size={18} />
        </span>
        <div>
          <h2 className="text-xl font-black leading-tight text-white sm:text-2xl">
            Recommended by CleverTap for you
          </h2>
          <p className="text-xs text-ink-500">
            Three rails, personalised on what you watch, speak and follow.
          </p>
        </div>
      </header>

      <RecoRail
        slotId="ct-reco-genre"
        dimension="Genre"
        icon={IconFilm}
        basis={basis.genre}
        excludeId={item.id}
        mediaType={mediaType}
        fetchFallback={
          genreId
            ? (signal) =>
                getList(
                  `discover/${mediaType}`,
                  { with_genres: String(genreId), sort_by: "popularity.desc" },
                  signal
                )
            : null
        }
      />

      <RecoRail
        slotId="ct-reco-language"
        dimension="Language"
        icon={IconFilm}
        basis={basis.language}
        excludeId={item.id}
        mediaType={mediaType}
        fetchFallback={
          basis.language
            ? (signal) =>
                getList(
                  `discover/${mediaType}`,
                  {
                    with_original_language: basis.language.code,
                    sort_by: "popularity.desc",
                  },
                  signal
                )
            : null
        }
      />

      <RecoRail
        slotId="ct-reco-director"
        dimension={mediaType === "tv" ? "Creator" : "Director"}
        icon={IconUser}
        basis={basis.director}
        excludeId={item.id}
        mediaType={mediaType}
        fetchFallback={
          basis.director?.id
            ? async (signal) => ({
                results: await getPersonWorks(basis.director.id, mediaType, signal),
              })
            : null
        }
      />
    </section>
  );
}

function RecoRail({ slotId, dimension, icon: Icon, basis, mediaType, excludeId, fetchFallback }) {
  if (!basis) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-800 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-400">
          <Icon size={12} />
          {dimension}
        </span>

        <h3 className="text-sm font-semibold text-ink-200">
          Based on{" "}
          {basis.personal ? (
            <>
              your favourite {dimension.toLowerCase()},{" "}
              <span className="text-brand-300">{basis.label}</span>
            </>
          ) : (
            <span className="text-brand-300">{basis.label}</span>
          )}
        </h3>

        {basis.image && (
          <img
            src={basis.image}
            alt=""
            loading="lazy"
            className="h-6 w-6 rounded-full border border-ink-700 object-cover"
          />
        )}

        <span className="hidden h-px flex-1 bg-gradient-to-r from-ink-750 to-transparent sm:block" />
      </div>

      <NativeSlot id={slotId}>
        <RecoFallback
          slotId={slotId}
          basisKey={basis.label}
          mediaType={mediaType}
          excludeId={excludeId}
          fetchFallback={fetchFallback}
        />
      </NativeSlot>
    </div>
  );
}

/**
 * The stand-in rail. Mounted only while its slot is empty, so a live campaign
 * both hides it and aborts its request.
 */
function RecoFallback({ slotId, basisKey, mediaType, excludeId, fetchFallback }) {
  const { data, loading } = useTmdb((signal) => fetchFallback(signal), [slotId, basisKey], {
    enabled: Boolean(fetchFallback),
  });

  const items = useMemo(
    () => (data?.results || []).filter((r) => r.id !== excludeId && r.poster_path).slice(0, 12),
    [data, excludeId]
  );

  if (!loading && items.length === 0) {
    return (
      <p className="py-4 text-sm text-ink-500">
        Nothing to show here yet — a CleverTap campaign targeting{" "}
        <code className="rounded bg-ink-800 px-1.5 py-0.5 text-xs text-ink-300">#{slotId}</code>{" "}
        will render into this space.
      </p>
    );
  }

  return (
    <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
      {loading
        ? Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="w-[140px] shrink-0 sm:w-[160px]">
              <PosterCardSkeleton />
            </div>
          ))
        : items.map((reco) => (
            <div key={reco.id} className="w-[140px] shrink-0 sm:w-[160px]">
              <TitleCard item={reco} mediaType={mediaType} />
            </div>
          ))}
    </div>
  );
}
