import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MovieTrailer from "../components/MovieTrailer";
import { addEventToCleverTap, updateProfileOnClevertap, generateRandomPrice } from "../utils/cleverTap";

const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";
const PENDING_ACTION_KEY = "pendingMovieAction";

export default function MovieDetailPage({ identity, profile = {} }) {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);

  // Deterministic per-title price: varies across content, stable across
  // re-renders/re-visits of the same title.
  const price = useMemo(
    () => (movie ? generateRandomPrice(movie.id) : 0),
    [movie]
  );

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
        setCast(creditsData.cast.slice(0, 10));

        addEventToCleverTap("Movie Viewed", {
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

  // Runs the actual purchase - only ever called once we know `identity` is set,
  // so it always tracks against the signed-in profile, never "Guest".
  const performBuyNow = (currentMovie) => {
    const buyerName = profile.Name || "";
    const buyerEmail = profile.Email || identity || "";
    const buyerPhone = profile.Phone || "";

    // Identity/profile already established at login - just keep it in sync.
    updateProfileOnClevertap({
      Name: buyerName,
      Email: buyerEmail,
      Phone: buyerPhone,
    });

    const amount = generateRandomPrice(currentMovie.id);
    addEventToCleverTap("Charged", {
      "Movie Title": currentMovie.title,
      "Movie ID": currentMovie.id,
      "Amount": amount,
      "Currency": "INR",
      "Name": buyerName,
      "Email": buyerEmail,
      "Phone": buyerPhone,
    });

    alert(`Thank you ${buyerName}! Your purchase for '${currentMovie.title}' is confirmed for ₹${amount}.`);
  };

  const performAddToWatchlist = (currentMovie) => {
    addEventToCleverTap("Added to Watchlist", {
      "Movie Title": currentMovie.title,
    });
    window.clevertap.profile.push({
      Site: {
        watchlist: { $add: currentMovie.title },
      },
    });
    alert(`'${currentMovie.title}' added to your watchlist!`);
  };

  // If the user isn't signed in yet, park the intended action and send them
  // to sign in/up first; once they're back here as an identified user, the
  // effect below resumes it automatically so the event lands on the right profile.
  const requireAuth = (action, currentMovie) => {
    if (!identity) {
      sessionStorage.setItem(
        PENDING_ACTION_KEY,
        JSON.stringify({ movieId: currentMovie.id, action })
      );
      navigate("/login", { state: { from: `/movie/${currentMovie.id}` } });
      return;
    }
    action === "buy" ? performBuyNow(currentMovie) : performAddToWatchlist(currentMovie);
  };

  const handleBuyNow = () => movie && requireAuth("buy", movie);
  const addToWatchlist = () => movie && requireAuth("watchlist", movie);

  // Resume a pending buy/watchlist action once the user is signed in and
  // we're back on the movie they were trying to act on.
  useEffect(() => {
    if (!identity || !movie) return;
    const raw = sessionStorage.getItem(PENDING_ACTION_KEY);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      if (pending.movieId === movie.id) {
        sessionStorage.removeItem(PENDING_ACTION_KEY);
        pending.action === "buy" ? performBuyNow(movie) : performAddToWatchlist(movie);
      }
    } catch {
      sessionStorage.removeItem(PENDING_ACTION_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, movie]);

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
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleBuyNow}
              className="px-6 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              Buy Now - &#8377;{price}
            </button>
            <button
              onClick={addToWatchlist}
              className="px-6 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Add to Watchlist
            </button>
          </div>
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
