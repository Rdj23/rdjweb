import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import MovieTrailer from "../components/MovieTrailer";

const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";

export default function MovieDetailPage({ identity }) {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!movieId) return;
      setLoading(true);
      try {
        const movieUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}`;
        const creditsUrl = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_KEY}`;

        const [movieRes, creditsRes] = await Promise.all([
          fetch(movieUrl),
          fetch(creditsUrl),
        ]);
        const movieData = await movieRes.json();
        const creditsData = await creditsRes.json();

        setMovie(movieData);
        console.log(movieData);
        setCast(creditsData.cast.slice(0, 10)); // Get top 10 cast members

        window.clevertap.event.push("Movie Viewed", {
          "Movie ID": movieData.id,
          "Movie Title": movieData.title,
          "Genre": movieData.genres.map((g) => g.name).join(", "),
          "Release_date": movieData.release_date,
          "Rating": movieData.vote_average,
          "poster_url": movieData.poster_path
            ? "https://image.tmdb.org/t/p/w300" + movieData.poster_path
            : "",
          "backdrop_url": movieData.backdrop_path
            ? "https://image.tmdb.org/t/p/w780" + movieData.backdrop_path
            : "",
        });
      } catch (e) {
        console.error("Failed to fetch movie data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [movieId]);

  const addToWatchlist = () => {
    if (!movie) return;

    // Push an event to CleverTap
    window.clevertap.event.push("Added to Watchlist", {
      "Movie Title": movie.title,
    });

    // Update the user's profile with the new watchlist item
    // NOTE: This assumes a simple comma-separated string. A real app might handle arrays.
    window.clevertap.profile.push({
      Site: {
        watchlist: { $add: movie.title }, // Use the $add operator to add to a multi-value property
      },
    });

    alert(`'${movie.title}' added to your watchlist!`);
  };

  if (loading)
    return <div className="text-center text-gray-500">Loading details...</div>;
  if (!movie)
    return <div className="text-center text-red-500">Movie not found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <img
          src={
            movie.poster_path
              ? `${IMAGE_BASE_URL}w300${movie.poster_path}`
              : "https://via.placeholder.com/300x450"
          }
          alt={movie.title}
          className="w-full md:w-1/3 max-w-xs mx-auto rounded-lg shadow-xl"
        />
        <div className="md:w-2/3">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {movie.title}
          </h1>
          <p className="text-gray-500 mt-1">{movie.tagline}</p>
          <div className="flex flex-wrap gap-2 my-4">
            {movie.genres.map((g) => (
              <span
                key={g.id}
                className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-full"
              >
                {g.name}
              </span>
            ))}
          </div>
          <p className="text-gray-700 leading-relaxed">{movie.overview}</p>
          <button
            onClick={addToWatchlist}
            className="mt-6 px-6 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Add to Watchlist
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Cast</h2>
        <div className="flex overflow-x-auto gap-4 pb-4">
          {cast.map((member) => (
            <div
              key={member.cast_id}
              className="flex-shrink-0 w-32 text-center"
            >
              <img
                src={
                  member.profile_path
                    ? `${IMAGE_BASE_URL}w185${member.profile_path}`
                    : "https://via.placeholder.com/185x278"
                }
                alt={member.name}
                className="rounded-lg shadow-md mb-2"
              />
              <p className="font-semibold text-sm text-gray-800">
                {member.name}
              </p>
              <p className="text-xs text-gray-500">{member.character}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Trailer</h2>
        <MovieTrailer movieId={movie.id} />
      </div>
    </div>
  );
}
