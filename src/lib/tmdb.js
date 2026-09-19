// Thin TMDB client with an in-memory response cache.
//
// The catalog is read-only and identical for every visitor, so re-fetching the
// same endpoint while the user pages back and forth is pure waste. Caching the
// in-flight promise (not just the result) also collapses the duplicate requests
// React StrictMode's double-effect would otherwise fire in development.

const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "";
const BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 120;

// Inline SVG placeholders - no network request, and no dependency on
// via.placeholder.com, which the previous build relied on and which no
// longer resolves.
export const POSTER_FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450"><rect width="300" height="450" fill="#181822"/><path d="M150 195a26 26 0 100-52 26 26 0 000 52zm-60 90 42-54 30 36 24-27 44 45z" fill="#353546"/></svg>`
  );

export const PROFILE_FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="185" height="278"><rect width="185" height="278" fill="#181822"/><circle cx="92" cy="110" r="34" fill="#353546"/><path d="M28 250c0-35 29-64 64-64s64 29 64 64z" fill="#353546"/></svg>`
  );

export const imageUrl = (path, size = "w500") =>
  path ? `${IMAGE_BASE}/${size}${path}` : null;

export const posterUrl = (path, size = "w342") => imageUrl(path, size) || POSTER_FALLBACK;

export const profileUrl = (path) => imageUrl(path, "w185") || PROFILE_FALLBACK;

// Poster srcset so phones download a 185px-wide image instead of a 500px one.
export const posterSrcSet = (path) =>
  path ? `${IMAGE_BASE}/w185${path} 185w, ${IMAGE_BASE}/w342${path} 342w, ${IMAGE_BASE}/w500${path} 500w` : undefined;

function prune() {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const oldest = cache.keys().next().value;
  cache.delete(oldest);
}

export class TmdbError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
  }
}

/**
 * GET a TMDB endpoint.
 * @param {string} path  e.g. "movie/popular"
 * @param {object} params extra query params
 * @param {{signal?: AbortSignal}} options
 */
export async function tmdb(path, params = {}, { signal } = {}) {
  if (!TMDB_KEY) {
    throw new TmdbError("VITE_TMDB_KEY is not set - add it to your .env file.", 401);
  }

  const query = new URLSearchParams({ api_key: TMDB_KEY, ...params });
  const url = `${BASE}/${path}?${query}`;
  const key = url;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    // Re-insert so the pruner evicts genuinely cold entries first.
    cache.delete(key);
    cache.set(key, hit);
    return hit.promise;
  }

  const promise = fetch(url, { signal }).then(async (res) => {
    if (!res.ok) {
      cache.delete(key);
      throw new TmdbError(`TMDB request failed (${res.status})`, res.status);
    }
    return res.json();
  });

  // A rejected promise must not stay cached, or the failure is permanent.
  promise.catch(() => cache.delete(key));

  cache.set(key, { at: Date.now(), promise });
  prune();
  return promise;
}

export const isAbort = (error) => error?.name === "AbortError";

/* ------------------------------------------------------------------ */
/* Movie / TV field normalisation                                      */
/* ------------------------------------------------------------------ */

// TMDB names the same field differently for movies and series.
export const titleOf = (item) => item?.title || item?.name || "Untitled";
export const releaseDateOf = (item) => item?.release_date || item?.first_air_date || "";

export const runtimeOf = (item) =>
  item?.runtime || (Array.isArray(item?.episode_run_time) ? item.episode_run_time[0] : null);

export const genreNames = (item) => (item?.genres || []).map((g) => g.name);

/* ------------------------------------------------------------------ */
/* Endpoint helpers                                                    */
/* ------------------------------------------------------------------ */

export const getTrending = (mediaType, signal) =>
  tmdb(`trending/${mediaType}/week`, {}, { signal });

export const getList = (path, params, signal) => tmdb(path, params, { signal });

export const search = (mediaType, query, signal) =>
  tmdb(`search/${mediaType}`, { query, include_adult: "false" }, { signal });

// One request instead of three: `append_to_response` bundles credits and
// videos into the detail payload.
export const getTitleDetail = (mediaType, id, signal) =>
  tmdb(`${mediaType}/${id}`, { append_to_response: "credits,videos,similar" }, { signal });

export const getSeason = (seriesId, seasonNumber, signal) =>
  tmdb(`tv/${seriesId}/season/${seasonNumber}`, {}, { signal });

export const findTrailer = (detail) => {
  const videos = detail?.videos?.results || [];
  return (
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ||
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    videos.find((v) => v.site === "YouTube" && v.type === "Teaser") ||
    null
  );
};
