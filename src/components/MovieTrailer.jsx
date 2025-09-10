import React, { useState, useEffect } from "react";

const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "";

export default function MovieTrailer({ movieId }) {
  const [videoKey, setVideoKey] = useState(null);

  useEffect(() => {
    async function load() {
      if (!movieId) return;
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_KEY}`
        );
        const data = await res.json();
        const trailer = (data.results || []).find(
          (v) => v.site === "YouTube" && v.type === "Trailer"
        );
        if (trailer) {
          setVideoKey(trailer.key);
        }
      } catch (e) {
        console.error("Failed to fetch trailer", e);
      }
    }
    load();
  }, [movieId]);

  if (!videoKey) {
    return <div className="text-sm text-gray-500">No trailer available for this movie.</div>;
  }

  return (
    <div className="w-full aspect-video">
      <iframe
        title="trailer"
        src={`https://www.youtube.com/embed/${videoKey}`}
        frameBorder="0"
        allowFullScreen
        className="w-full h-full rounded"
      ></iframe>
    </div>
  );
}
