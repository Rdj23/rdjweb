#!/usr/bin/env python3
"""
Generate a CleverTap product-recommendations catalog CSV from live TMDB data.

Docs this follows: https://docs.clevertap.com/docs/creating-a-recommendations
CleverTap catalog rule used here: every row must have Identity, Name, ImageURL.
Name is what gets matched against the "Movie Title" property on your
"Content Viewed" event, so titles are taken verbatim from TMDB.

Usage:
    export TMDB_API_KEY="your_v3_api_key"
    pip install -r requirements.txt
    python generate_catalog.py --count 600 --out catalog.csv

Get a free TMDB API key: https://www.themoviedb.org/settings/api
"""

import argparse
import csv
import os
import sys
import time

import requests

API_BASE = "https://api.themoviedb.org/3"
IMAGE_BASE = "https://image.tmdb.org/t/p/w500"

# List endpoints to sweep for a mix of currently-playing, popular, top-rated
# and upcoming titles so the catalog isn't just one narrow slice of TMDB.
MOVIE_ENDPOINTS = ["now_playing", "popular", "top_rated", "upcoming"]
TV_ENDPOINTS = ["on_the_air", "popular", "top_rated", "airing_today"]

PAGES_PER_ENDPOINT = 8  # 20 items/page -> up to 160 items per endpoint
REQUEST_DELAY_SEC = 0.05
MIN_PRICE, MAX_PRICE = 4.99, 19.99


def api_get(session, path, params):
    params = dict(params)
    for attempt in range(5):
        resp = session.get(f"{API_BASE}{path}", params=params, timeout=15)
        if resp.status_code == 429:
            time.sleep(1.5 * (attempt + 1))
            continue
        resp.raise_for_status()
        return resp.json()
    resp.raise_for_status()


def fetch_list(session, media_type, endpoint, pages):
    items = []
    for page in range(1, pages + 1):
        data = api_get(session, f"/{media_type}/{endpoint}", {"page": page, "language": "en-US"})
        results = data.get("results", [])
        if not results:
            break
        items.extend(results)
        if page >= data.get("total_pages", 1):
            break
        time.sleep(REQUEST_DELAY_SEC)
    return items


def fetch_director(session, media_type, tmdb_id, fallback_names):
    """Movies: crew job == 'Director'. TV: no single director, use creators."""
    if media_type == "movie":
        data = api_get(session, f"/movie/{tmdb_id}/credits", {})
        directors = [c["name"] for c in data.get("crew", []) if c.get("job") == "Director"]
        if directors:
            return ", ".join(directors)
        return "Unknown"
    return ", ".join(fallback_names) if fallback_names else "Unknown"


def price_from_rating(rating):
    rating = max(0.0, min(10.0, rating or 0.0))
    price = MIN_PRICE + (rating / 10.0) * (MAX_PRICE - MIN_PRICE)
    return round(price, 2)


def build_rows(session, target_count, verbose):
    seen = {}

    def collect(media_type, endpoints):
        for endpoint in endpoints:
            if verbose:
                print(f"Fetching {media_type}/{endpoint} ...", file=sys.stderr)
            for item in fetch_list(session, media_type, endpoint, PAGES_PER_ENDPOINT):
                key = (media_type, item["id"])
                if key not in seen:
                    seen[key] = item

    collect("movie", MOVIE_ENDPOINTS)
    collect("tv", TV_ENDPOINTS)

    rows = []
    for (media_type, tmdb_id), item in seen.items():
        title = item.get("title") or item.get("name")
        poster_path = item.get("poster_path") or item.get("backdrop_path")
        if not title or not poster_path:
            continue  # ImageURL and Name are mandatory catalog fields

        release_date = item.get("release_date") or item.get("first_air_date") or ""
        rating = round(item.get("vote_average") or 0.0, 1)
        director = fetch_director(session, media_type, tmdb_id, item.get("created_by_names"))
        time.sleep(REQUEST_DELAY_SEC)

        rows.append({
            "Identity": f"{'MOV' if media_type == 'movie' else 'TV'}-{tmdb_id}",
            "Name": title,
            "ImageURL": f"{IMAGE_BASE}{poster_path}",
            "Rating": rating,
            "Price": price_from_rating(rating),
            "DirectorName": director,
            "Type": "Movie" if media_type == "movie" else "TV Series",
            "ReleaseYear": release_date[:4] if release_date else "",
        })
        if verbose and len(rows) % 50 == 0:
            print(f"  processed {len(rows)} rows...", file=sys.stderr)
        if len(rows) >= target_count:
            break

    return rows


def main():
    parser = argparse.ArgumentParser(description="Build a TMDB catalog CSV for CleverTap recommendations.")
    parser.add_argument("--count", type=int, default=600, help="Target number of rows (default 600)")
    parser.add_argument("--out", default="catalog.csv", help="Output CSV path (default catalog.csv)")
    parser.add_argument("--api-key", default=os.environ.get("TMDB_API_KEY"), help="TMDB v3 API key (or set TMDB_API_KEY)")
    parser.add_argument("--quiet", action="store_true", help="Suppress progress output")
    args = parser.parse_args()

    if not args.api_key:
        sys.exit("Missing TMDB API key. Set TMDB_API_KEY or pass --api-key. "
                 "Get one free at https://www.themoviedb.org/settings/api")

    session = requests.Session()
    session.params = {"api_key": args.api_key}

    rows = build_rows(session, args.count, verbose=not args.quiet)

    fieldnames = ["Identity", "Name", "ImageURL", "Rating", "Price", "DirectorName", "Type", "ReleaseYear"]
    with open(args.out, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {args.out}", file=sys.stderr)


if __name__ == "__main__":
    main()
