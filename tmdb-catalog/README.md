# TMDB → CleverTap Recommendations Catalog

Builds the catalog CSV needed for CleverTap's
[recommendations feature](https://docs.clevertap.com/docs/creating-a-recommendations),
driven off your `Content Viewed` event (matched via the `Movie Title` event property).

## Why this is a script, not a static CSV

This session's network policy blocks `api.themoviedb.org` and `themoviedb.org`
outright (confirmed via direct request and via the fetch tool — both returned
403 from the egress proxy), so no live TMDB data could be pulled from inside
this environment. Run the script yourself anywhere with normal internet
access and you'll get a real, current catalog instead of stale/fabricated
data.

## Setup

1. Get a free TMDB v3 API key: https://www.themoviedb.org/settings/api
2. `pip install -r requirements.txt`
3. `export TMDB_API_KEY="your_key_here"`
4. `python generate_catalog.py --count 600 --out catalog.csv`

Runs in roughly 1-2 minutes (one extra API call per row to fetch director
credits). Pulls a mix of now-playing, popular, top-rated and upcoming movies
plus on-the-air/popular/top-rated/airing-today TV series, dedupes by TMDB id,
and stops once it hits `--count` rows.

## CSV columns

| Column | Required by CleverTap | Source |
|---|---|---|
| `Identity` | Yes | `MOV-<tmdb_id>` / `TV-<tmdb_id>` — arbitrary unique key |
| `Name` | Yes | TMDB title — **must match your `Movie Title` event property values** |
| `ImageURL` | Yes | TMDB poster (`w500`), full CDN URL |
| `Rating` | Requested | TMDB `vote_average` (0-10) |
| `Price` | Requested | **Synthetic placeholder** — TMDB has no pricing data. Scaled $4.99-$19.99 by rating. Replace with your real rental/licensing price before using it for anything price-sensitive. |
| `DirectorName` | Requested | Movies: TMDB crew, job=Director. TV: no single "director" concept in TMDB, falls back to series creator(s), or `Unknown`. |
| `Type` | Extra | `Movie` or `TV Series` |
| `ReleaseYear` | Extra | Release/first-air year |

## Uploading to CleverTap

Follow the "Creating a Recommendations" doc: create the catalog with
`Identity`, `Name`, `ImageURL` mapped as-is, upload `catalog.csv`, then build
the recommendation model against your `Content Viewed` event using `Movie
Title` as the join key to `Name`.

Two things worth checking before you upload:
- **Title collisions**: if two different TMDB entries share an identical
  title (e.g. a remake), CleverTap will match your event's `Movie Title` to
  whichever catalog row has that `Name` — check your event data for
  duplicate titles across movies/shows if that matters for your use case.
- **Price**: if you don't actually sell/rent by title, consider dropping the
  `Price` column rather than uploading a synthetic value.
