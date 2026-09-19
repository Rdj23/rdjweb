// Series don't have showtimes, so they're sold as streaming passes instead:
// a single episode, a whole season, or the complete series. Prices are seeded
// per series so they stay stable across visits, like cinema pricing.

import { createRandom } from "./seed";

export const QUALITIES = [
  { key: "hd", label: "HD", detail: "1080p · Stereo", multiplier: 1 },
  { key: "uhd", label: "4K HDR", detail: "2160p · Dolby Atmos", multiplier: 1.3 },
];

export const PASS_KINDS = {
  episode: { key: "episode", label: "Single episode", validityDays: 2, blurb: "Watch once, 48 hours to finish" },
  season: { key: "season", label: "Season pass", validityDays: 30, blurb: "Every episode of the season, 30 days" },
  series: { key: "series", label: "Complete series", validityDays: 365, blurb: "All seasons, yours for a year" },
};

const roundTo9 = (n) => Math.max(9, Math.round(n / 10) * 10 - 1);

/** Base price (HD) for each pass kind. `seasons` comes from TMDB's detail payload. */
export function passPricing({ seriesId, seasons = [] }) {
  const rand = createRandom(`pass|${seriesId}`);
  const episodeBase = 39 + Math.floor(rand() * 7) * 10; // 39 - 99

  // Aired seasons only - TMDB lists "Specials" as season 0 and sometimes
  // announces an upcoming season with zero episodes.
  const realSeasons = seasons.filter((s) => s.season_number > 0 && s.episode_count > 0);
  const totalEpisodes = realSeasons.reduce((sum, s) => sum + s.episode_count, 0);

  const seasonPrice = (episodeCount) =>
    roundTo9(Math.min(episodeBase * episodeCount * 0.45, 899));

  const seriesPrice = roundTo9(
    Math.min(realSeasons.reduce((sum, s) => sum + seasonPrice(s.episode_count), 0) * 0.65, 1999)
  );

  return { episodeBase, seasonPrice, seriesPrice, realSeasons, totalEpisodes };
}

export const applyQuality = (basePrice, qualityKey) => {
  const quality = QUALITIES.find((q) => q.key === qualityKey) || QUALITIES[0];
  return Math.round((basePrice * quality.multiplier) / 10) * 10 - 1;
};

export const qualityByKey = (key) => QUALITIES.find((q) => q.key === key) || QUALITIES[0];
