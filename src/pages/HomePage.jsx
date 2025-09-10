import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "";
const IMAGE_BASE_URL_W300 = "https://image.tmdb.org/t/p/w300";

// Define the filter chips
const filterChips = [
  { name: "Popular", path: "movie/popular" },
  { name: "Top Rated", path: "movie/top_rated" },
  { name: "Anime", path: "discover/movie", params: "&with_genres=16&sort_by=popularity.desc" },
  { name: "Horror", path: "discover/movie", params: "&with_genres=27&sort_by=popularity.desc" },
];

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(filterChips[0].name);

  useEffect(() => {
    window.clevertap.event.push("Page Viewed", { "Page Name": "Home" });
  }, []); // The empty dependency array ensures it runs only once


  const fetchMovies = useCallback(async (filter) => {
    setLoading(true);
    let url = "";

    if (query) {
      // Search takes priority if there's a query
      url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`;
    } else {
      const selectedChip = filterChips.find(c => c.name === filter);
      url = `https://api.themoviedb.org/3/${selectedChip.path}?api_key=${TMDB_KEY}${selectedChip.params || ''}`;
    }
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      setMovies(data.results || []);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchMovies(activeFilter);
  }, [activeFilter, fetchMovies]);

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

      <div className="mb-8">
        <input
          className="w-full px-4 py-2 text-gray-800 bg-white border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Search for a movie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setActiveFilter(''); // De-select chips when searching
              fetchMovies(null);
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
        <div className="text-center text-gray-500">Loading movies...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.map((m) => (
            <Link
              to={`/movie/${m.id}`}
              key={m.id}
              className="group bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative">
                <img
                  src={m.poster_path ? `${IMAGE_BASE_URL_W300}${m.poster_path}` : 'https://via.placeholder.com/300x450'}
                  alt={m.title}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-gray-800 truncate">{m.title}</h3>
                <p className="text-xs text-gray-500">{m.release_date?.split('-')[0]}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
