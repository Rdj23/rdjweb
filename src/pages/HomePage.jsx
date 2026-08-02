import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { addEventToCleverTap } from "../utils/cleverTap";

const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "";
const IMAGE_BASE_URL_W300 = "https://image.tmdb.org/t/p/w300";

const contentTypes = [
  { key: "movie", label: "Movies" },
  { key: "tv", label: "TV Series" },
];

// Filter chips are per content type since TMDB's movie/tv catalog endpoints differ
const filterChipsByType = {
  movie: [
    { name: "Popular", path: "movie/popular" },
    { name: "Top Rated", path: "movie/top_rated" },
    { name: "Anime", path: "discover/movie", params: "&with_genres=16&sort_by=popularity.desc" },
    { name: "Horror", path: "discover/movie", params: "&with_genres=27&sort_by=popularity.desc" },
  ],
  tv: [
    { name: "Popular", path: "tv/popular" },
    { name: "Top Rated", path: "tv/top_rated" },
    { name: "Airing Today", path: "tv/airing_today" },
    { name: "Anime", path: "discover/tv", params: "&with_genres=16&sort_by=popularity.desc" },
  ],
};

// Movie and TV results use different field names for title/date
const getTitle = (item, type) => (type === "tv" ? item.name : item.title);
const getDate = (item, type) => (type === "tv" ? item.first_air_date : item.release_date);

export default function HomePage() {
  const [contentType, setContentType] = useState("movie");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const filterChips = filterChipsByType[contentType];
  const [activeFilter, setActiveFilter] = useState(filterChips[0].name);

  useEffect(() => {
    addEventToCleverTap("Page Viewed", { "Page Name": "Home" });
  }, []); // The empty dependency array ensures it runs only once

  const fetchItems = useCallback(async (filter, type) => {
    setLoading(true);
    let url = "";

    if (query) {
      // Search takes priority if there's a query
      url = `https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`;
    } else {
      const selectedChip = filterChipsByType[type].find((c) => c.name === filter);
      url = `https://api.themoviedb.org/3/${selectedChip.path}?api_key=${TMDB_KEY}${selectedChip.params || ""}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();
      setItems(data.results || []);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchItems(activeFilter, contentType);
  }, [activeFilter, contentType, fetchItems]);

  const handleTypeChange = (type) => {
    setQuery("");
    setContentType(type);
    setActiveFilter(filterChipsByType[type][0].name);
  };

  const handleChipClick = (filterName) => {
    setQuery(""); // Clear search query when a chip is clicked
    setActiveFilter(filterName);
  };

  return (
    <div className="space-y-8">

        {/* 1. THIS IS YOUR NEW PLACEHOLDER FOR THE CUSTOM POP-UP */}
      <div id="ct-custom-popup-slot"></div>


      {/* Native Display Slot for CleverTap */}
      <div
        id="ct-native-banner-slot"
        className="mb-6 p-4 border border-dashed rounded-lg text-center text-gray-400 min-h-[100px] bg-white"
      >
        Native Display Campaign Renders Here
      </div>

      <div className="flex gap-2 mb-6">
        {contentTypes.map((ct) => (
          <button
            key={ct.key}
            onClick={() => handleTypeChange(ct.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              contentType === ct.key
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            {ct.label}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <input
          className="w-full px-4 py-2 text-gray-800 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder={`Search for a ${contentType === "tv" ? "TV series" : "movie"}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setActiveFilter(''); // De-select chips when searching
              fetchItems(null, contentType);
            }
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        {filterChips.map((chip) => (
          <button
            key={chip.name}
            onClick={() => handleChipClick(chip.name)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
              activeFilter === chip.name
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {chip.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading {contentType === "tv" ? "series" : "movies"}...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {items.map((item) => (
            <Link
              to={`/title/${contentType}/${item.id}`}
              key={item.id}
              className="group bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative">
                <img
                  src={item.poster_path ? `${IMAGE_BASE_URL_W300}${item.poster_path}` : 'https://via.placeholder.com/300x450'}
                  alt={getTitle(item, contentType)}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-gray-800 truncate">{getTitle(item, contentType)}</h3>
                <p className="text-xs text-gray-500">{getDate(item, contentType)?.split('-')[0]}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
