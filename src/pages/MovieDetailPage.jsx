import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import MovieTrailer from "../components/MovieTrailer";
import { addEventToCleverTap, updateProfileOnClevertap } from "../utils/cleverTap";

const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/";

export default function MovieDetailPage() {
  const { movieId } = useParams();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

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

  const isFormValid =
    form.name.trim() !== "" &&
    form.email.trim() !== "" &&
    form.phone.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    /^\d{10}$/.test(form.phone);

  const handleBuyNow = () => {
    if (!movie || !isFormValid) return;

    // Append PII to the existing profile (same identity assigned on landing)
    // Using profile.push (fireInitialEvent=false) so it updates, not creates new
    updateProfileOnClevertap({
      Name: form.name,
      Email: form.email,
      Phone: `+91${form.phone}`,
    });

    // Fire the Charged event
    addEventToCleverTap("Charged", {
      "Movie Title": movie.title,
      "Movie ID": movie.id,
      "Amount": 199,
      "Currency": "INR",
      "Name": form.name,
      "Email": form.email,
      "Phone": form.phone,
    });

    setShowModal(false);
    setForm({ name: "", email: "", phone: "" });
    alert(`Thank you ${form.name}! Your purchase for '${movie.title}' is confirmed.`);
  };

  const addToWatchlist = () => {
    if (!movie) return;
    addEventToCleverTap("Added to Watchlist", {
      "Movie Title": movie.title,
    });
    window.clevertap.profile.push({
      Site: {
        watchlist: { $add: movie.title },
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
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              Buy Now - &#8377;199
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

      {/* PII Data Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-start bg-black/50">
          <div className="bg-white w-full max-w-md ml-0 md:ml-8 h-full md:h-auto md:rounded-xl shadow-2xl p-6 md:p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Complete Your Purchase
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
              <img
                src={
                  movie.poster_path
                    ? `${IMAGE_BASE_URL}w92${movie.poster_path}`
                    : "https://via.placeholder.com/92x138"
                }
                alt={movie.title}
                className="w-16 rounded"
              />
              <div>
                <p className="font-semibold text-gray-800">{movie.title}</p>
                <p className="text-green-600 font-bold text-lg">&#8377;199</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
                {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
                  <p className="text-red-500 text-xs mt-1">Enter a valid email address</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                    }
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                </div>
                {form.phone && !/^\d{10}$/.test(form.phone) && (
                  <p className="text-red-500 text-xs mt-1">Enter a valid 10-digit mobile number</p>
                )}
              </div>
            </div>

            <button
              onClick={handleBuyNow}
              disabled={!isFormValid}
              className={`w-full mt-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                isFormValid
                  ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Proceed & Pay &#8377;199
            </button>
          </div>
        </div>
      )}

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
