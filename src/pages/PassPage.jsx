import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SummaryBar from "../components/booking/SummaryBar";
import Badge from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState, Spinner } from "../components/ui/States";
import { IconChevronLeft, IconCheck, IconStar } from "../components/ui/Icons";
import { useTmdb } from "../hooks/useTmdb";
import { useScrollTop } from "../hooks/useScrollTop";
import {
  getTitleDetail, getSeason, posterUrl, imageUrl, titleOf, releaseDateOf, genreNames,
} from "../lib/tmdb";
import { formatMoney, yearOf } from "../lib/format";
import { PASS_KINDS, QUALITIES, passPricing, applyQuality, qualityByKey } from "../lib/passes";
import { passTotals } from "../lib/pricing";
import { useBooking } from "../context/booking-context";
import { trackPassSelected } from "../lib/analytics";

export default function PassPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setDraft } = useBooking();
  const [kind, setKind] = useState("season");
  const [qualityKey, setQualityKey] = useState("hd");
  const [seasonNumber, setSeasonNumber] = useState(null);
  const [episodeNumber, setEpisodeNumber] = useState(null);

  useScrollTop(id);

  const { data: item, loading, error, reload } = useTmdb(
    (signal) => getTitleDetail("tv", id, signal),
    [id]
  );

  const pricing = useMemo(
    () => (item ? passPricing({ seriesId: item.id, seasons: item.seasons || [] }) : null),
    [item]
  );

  // Default to the first aired season once the detail payload lands.
  useEffect(() => {
    if (pricing?.realSeasons?.length && seasonNumber === null) {
      setSeasonNumber(pricing.realSeasons[0].season_number);
    }
  }, [pricing, seasonNumber]);

  // Episodes are only fetched when the user is actually picking one.
  const episodesQuery = useTmdb(
    (signal) => getSeason(id, seasonNumber, signal),
    [id, seasonNumber],
    { enabled: kind === "episode" && seasonNumber !== null }
  );

  const selectedSeason = pricing?.realSeasons?.find((s) => s.season_number === seasonNumber) || null;
  const quality = qualityByKey(qualityKey);

  const option = useMemo(() => {
    if (!pricing || !item) return null;

    if (kind === "episode") {
      const episode = (episodesQuery.data?.episodes || []).find(
        (e) => e.episode_number === episodeNumber
      );
      return {
        kind,
        kindLabel: PASS_KINDS.episode.label,
        label: episode
          ? `S${String(seasonNumber).padStart(2, "0")}E${String(episodeNumber).padStart(2, "0")} · ${episode.name}`
          : "Pick an episode",
        ready: Boolean(episode),
        seasonNumber,
        episodeNumber,
        episodeName: episode?.name || null,
        validityDays: PASS_KINDS.episode.validityDays,
        price: applyQuality(pricing.episodeBase, qualityKey),
      };
    }

    if (kind === "season") {
      const base = selectedSeason ? pricing.seasonPrice(selectedSeason.episode_count) : 0;
      return {
        kind,
        kindLabel: PASS_KINDS.season.label,
        label: selectedSeason
          ? `${selectedSeason.name} · ${selectedSeason.episode_count} episodes`
          : "Pick a season",
        ready: Boolean(selectedSeason),
        seasonNumber,
        validityDays: PASS_KINDS.season.validityDays,
        price: applyQuality(base, qualityKey),
      };
    }

    return {
      kind: "series",
      kindLabel: PASS_KINDS.series.label,
      label: `All ${pricing.realSeasons.length} seasons · ${pricing.totalEpisodes} episodes`,
      ready: pricing.realSeasons.length > 0,
      validityDays: PASS_KINDS.series.validityDays,
      price: applyQuality(pricing.seriesPrice, qualityKey),
    };
  }, [kind, pricing, item, selectedSeason, seasonNumber, episodeNumber, episodesQuery.data, qualityKey]);

  const totals = useMemo(() => passTotals(option?.price || 0), [option]);

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading || !item || !pricing || !option) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const name = titleOf(item);

  const proceed = () => {
    if (!option.ready) return;
    trackPassSelected({ item, option, quality });
    setDraft({
      kind: "pass",
      title: {
        id: Number(id),
        mediaType: "tv",
        name,
        posterPath: item.poster_path || null,
        year: yearOf(releaseDateOf(item)),
        genres: genreNames(item).slice(0, 3),
      },
      pass: {
        kind: option.kind,
        kindLabel: option.kindLabel,
        label: option.label,
        seasonNumber: option.seasonNumber ?? null,
        episodeNumber: option.episodeNumber ?? null,
        episodeName: option.episodeName ?? null,
        quality: quality.key,
        qualityLabel: quality.label,
        validityDays: option.validityDays,
      },
      amount: totals,
    });
    navigate("/checkout");
  };

  return (
    <div className="space-y-6">
      <Link
        to={`/title/tv/${id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-400 transition-colors hover:text-brand-300"
      >
        <IconChevronLeft size={16} />
        Back to series
      </Link>

      <header className="surface flex items-center gap-4 p-4">
        <img
          src={posterUrl(item.poster_path, "w185")}
          alt=""
          className="h-24 w-16 shrink-0 rounded-lg border border-ink-800 object-cover"
        />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-white sm:text-2xl">{name}</h1>
          <p className="mt-1 text-sm text-ink-400">
            {pricing.realSeasons.length} season{pricing.realSeasons.length === 1 ? "" : "s"} ·{" "}
            {pricing.totalEpisodes} episodes
          </p>
          {item.vote_average > 0 && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand-300">
              <IconStar size={13} />
              {item.vote_average.toFixed(1)}
            </p>
          )}
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white">Choose your pass</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.values(PASS_KINDS).map((passKind) => {
            const active = kind === passKind.key;
            const preview =
              passKind.key === "episode"
                ? applyQuality(pricing.episodeBase, qualityKey)
                : passKind.key === "season"
                  ? applyQuality(selectedSeason ? pricing.seasonPrice(selectedSeason.episode_count) : 0, qualityKey)
                  : applyQuality(pricing.seriesPrice, qualityKey);

            return (
              <button
                key={passKind.key}
                type="button"
                onClick={() => setKind(passKind.key)}
                aria-pressed={active}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? "border-brand-400 bg-brand-400/10 shadow-glow"
                    : "border-ink-750 bg-ink-850 hover:border-ink-600"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`font-semibold ${active ? "text-brand-300" : "text-white"}`}>
                    {passKind.label}
                  </span>
                  {active && <IconCheck size={16} className="text-brand-400" />}
                </div>
                <p className="mt-1 text-xs text-ink-400">{passKind.blurb}</p>
                <p className="mt-3 text-lg font-black text-white">{formatMoney(preview)}</p>
              </button>
            );
          })}
        </div>
      </section>

      {kind !== "series" && pricing.realSeasons.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">Season</h2>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {pricing.realSeasons.map((season) => (
              <button
                key={season.season_number}
                type="button"
                onClick={() => {
                  setSeasonNumber(season.season_number);
                  setEpisodeNumber(null);
                }}
                aria-pressed={season.season_number === seasonNumber}
                className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  season.season_number === seasonNumber
                    ? "border-brand-400 bg-brand-400 text-ink-950"
                    : "border-ink-750 bg-ink-850 text-ink-300 hover:border-ink-600 hover:text-white"
                }`}
              >
                {season.name}
                <span className="ml-1.5 text-xs font-normal opacity-70">
                  {season.episode_count} ep
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {kind === "episode" && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-white">Episode</h2>
          {episodesQuery.loading ? (
            <div className="flex justify-center py-8">
              <Spinner size={24} />
            </div>
          ) : episodesQuery.error ? (
            <ErrorState message="Couldn't load episodes." onRetry={episodesQuery.reload} />
          ) : (
            <div className="space-y-2">
              {(episodesQuery.data?.episodes || []).map((episode) => {
                const active = episode.episode_number === episodeNumber;
                return (
                  <button
                    key={episode.id}
                    type="button"
                    onClick={() => setEpisodeNumber(episode.episode_number)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? "border-brand-400 bg-brand-400/10"
                        : "border-ink-750 bg-ink-850 hover:border-ink-600"
                    }`}
                  >
                    <img
                      src={imageUrl(episode.still_path, "w300") || posterUrl(item.poster_path, "w185")}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-14 w-24 shrink-0 rounded-lg border border-ink-800 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {episode.episode_number}. {episode.name}
                      </p>
                      <p className="line-clamp-2 text-xs text-ink-400">
                        {episode.overview || "No synopsis available."}
                      </p>
                    </div>
                    {active && <IconCheck size={18} className="shrink-0 text-brand-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white">Quality</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {QUALITIES.map((q) => {
            const active = q.key === qualityKey;
            return (
              <button
                key={q.key}
                type="button"
                onClick={() => setQualityKey(q.key)}
                aria-pressed={active}
                className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                  active ? "border-brand-400 bg-brand-400/10" : "border-ink-750 bg-ink-850 hover:border-ink-600"
                }`}
              >
                <div>
                  <p className={`font-semibold ${active ? "text-brand-300" : "text-white"}`}>
                    {q.label}
                  </p>
                  <p className="text-xs text-ink-400">{q.detail}</p>
                </div>
                {q.multiplier > 1 && <Badge tone="brand">+{Math.round((q.multiplier - 1) * 100)}%</Badge>}
              </button>
            );
          })}
        </div>
      </section>

      <SummaryBar
        label={option.label}
        sublabel={`${option.kindLabel} · ${quality.label} · ${option.validityDays}-day access`}
        total={totals.total}
        disabled={!option.ready}
        actionLabel="Proceed"
        onAction={proceed}
      />
    </div>
  );
}
