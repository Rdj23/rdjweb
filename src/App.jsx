// src/App.jsx
import React, { useEffect, useState } from "react";

const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "";


export default function App() {
  const [screen, setScreen] = useState("login"); // login | home | detail | profile
  const [email, setEmail] = useState("");
  const [identity, setIdentity] = useState("");
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

 
  // When Home mounts -> simple Page Viewed and load movies
 // Fetch movies when on home
  useEffect(() => {
    if (screen === "home") {
      clevertap.event.push("Page Viewed", { page: "Home" });
      fetchMovies();
    }
  }, [screen]);

  async function fetchMovies(q) {
    setLoading(true);
    const url = q
      ? `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(
          q
        )}`
      : `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=en-US&page=1`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      setMovies(data.results || []);
    } catch (e) {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }

  // login -> onUserLogin and go to home
  function handleLogin(e) {
  e.preventDefault();
  if (!email) return alert("Enter email");

  const id = email.toLowerCase().trim();

  const profile = {
    Name: email.split("@")[0] || "User",
    Identity: id,
    Email: id,
    "MSG-push": true,
    "MSG-email": true,
   
  };

  // ✅ Correct CleverTap call with "Site"
  window.clevertap.onUserLogin.push({ Site: profile });

  setIdentity(id);
  setScreen("home");
}

  // movie clicked: record event and open detail screen
   function handleMovieClick(m) {
  console.log("Movie object:", m);

  clevertap.event.push("Movie Clicked", {
    id: String(m.id),
    title: m.title || "",
    release_date: m.release_date || "",
    rating: m.vote_average || 0,
    language: m.original_language || "",

    // full URLs for images
    poster_url: m.poster_path
      ? "https://image.tmdb.org/t/p/w300" + m.poster_path
      : "",
    backdrop_url: m.backdrop_path
      ? "https://image.tmdb.org/t/p/w780" + m.backdrop_path
      : "",
  });
}

  // soft prompt (Enable Notifications button)
  function requestSoftPrompt() {
    const notif = {
      titleText: "Turn On Notifications?",
      bodyText: "We will only send you relevant and useful updates.",
      okButtonText: "Allow",
      rejectButtonText: "Later",
      okButtonColor: "#0b82ff",
      askAgainTimeInSeconds: 30,
      serviceWorkerPath: "/clevertap_sw.js",
    };
    window.clevertap.push(["notifications", notif]);
    window.clevertap.notifications.push(notif);
  }

  // Profile update page: update name, mobile, favGenre, watchlistString
  function ProfileScreen({ onClose }) {
    const [name, setName] = useState(identity.split("@")[0] || "");
    const [mobile, setMobile] = useState("");
    const [favGenre, setFavGenre] = useState("");
    const [watchlist, setWatchlist] = useState(""); // comma-separated ids

    function saveProfile() {
      // use clevertap.profile.push per docs
      const payload = {
        Name: name,
        Phone: mobile || undefined,
        FavGenre: favGenre || undefined,
        Watchlist: watchlist || undefined, // string
      };
      window.clevertap.profile.push({ Site: payload });
      console.log(payload);
      alert("Profile saved");
      onClose();
    }

    function logout() {
      setIdentity("");
      setScreen("login");
    }

    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Profile</h2>
        <div className="mb-2 text-sm text-gray-600">Email: {identity}</div>
        <label className="block mb-2">
          <div className="text-sm">Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </label>
        <label className="block mb-2">
          <div className="text-sm">Mobile</div>
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </label>
        <label className="block mb-2">
          <div className="text-sm">Fav Genre</div>
          <input value={favGenre} onChange={(e) => setFavGenre(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </label>
        <label className="block mb-4">
          <div className="text-sm">Watchlist (comma-separated movie ids)</div>
          <input value={watchlist} onChange={(e) => setWatchlist(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </label>
        <div className="flex gap-3">
          <button onClick={saveProfile} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
          <button onClick={logout} className="px-4 py-2 bg-gray-200 rounded">Logout</button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded">Close</button>
        </div>
      </div>
    );
  }

  // Movie detail screen
  function DetailScreen({ movie, onBack }) {
    if (!movie) return null;
    const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : "";
    const backdrop = movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : "";

    function addToWatchlist() {
      // read, append, save on profile as comma string
      // NOTE: this is client-only; better to fetch current profile then update
      const current = ""; // we keep simple: user enters watchlist in profile screen
      const newStr = current ? `${current},${movie.id}` : String(movie.id);
      window.clevertap.profile.push({ Watchlist: newStr });
      alert("Added to watchlist (profile updated)");
    }

    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex gap-6">
          <img src={poster} alt={movie.title} className="w-48 rounded" />
          <div>
            <h2 className="text-2xl font-bold mb-2">{movie.title}</h2>
            <p className="mb-3 text-gray-700">{movie.overview}</p>
            <div className="mb-2"><strong>Release:</strong> {movie.release_date}</div>
            <div className="mb-4"><strong>Rating:</strong> {movie.vote_average}</div>
            <div className="flex gap-3">
              <button onClick={addToWatchlist} className="px-4 py-2 bg-indigo-600 text-white rounded">Add Watchlist</button>
              <button onClick={onBack} className="px-4 py-2 bg-gray-200 rounded">Back</button>
            </div>
          </div>
        </div>

        {/* trailer embed if available by searching videos endpoint (simple) */}
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Trailer</h3>
          <MovieTrailer movieId={movie.id} />
        </div>
      </div>
    );
  }

  // small component to fetch first trailer and embed youtube if found
  function MovieTrailer({ movieId }) {
    const [videoKey, setVideoKey] = useState(null);
    useEffect(() => {
      async function load() {
        try {
          const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_KEY}`);
          const data = await res.json();
          const yt = (data.results || []).find((v) => v.site === "YouTube" && v.type === "Trailer");
          if (yt) setVideoKey(yt.key);
        } catch {}
      }
      load();
    }, [movieId]);
    if (!videoKey) return <div className="text-sm text-gray-500">No trailer available</div>;
    return (
      <div className="w-full aspect-video">
        <iframe title="trailer" src={`https://www.youtube.com/embed/${videoKey}`} frameBorder="0" allowFullScreen className="w-full h-96 rounded"></iframe>
      </div>
    );
  }

  // topbar profile icon
  function Topbar() {
    return (
      <nav className="bg-white shadow px-4 py-3 flex justify-between items-center">
        <div className="font-bold">Movies Demo</div>
        <div className="flex items-center gap-4">
          {screen === "home" && <div>User: {identity}</div>}
          {screen === "home" && (
            <button title="Profile" onClick={() => setScreen("profile")} className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              {identity ? identity[0]?.toUpperCase() : "U"}
            </button>
          )}
        </div>
      </nav>
    );
  }

  // render
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <main className="p-6 max-w-6xl mx-auto">
        {screen === "login" && (
          <form onSubmit={handleLogin} className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Sign in</h2>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
              required
            />
            <button className="px-4 py-2 bg-indigo-600 text-white rounded">Sign In</button>
          </form>
        )}

        {screen === "home" && (
          <>
            <div id="ct-local-web-popup" className="mb-6 p-6 border border-dashed rounded text-center text-gray-400">
              Web Pop-up (reserved space) — campaigns can render here
            </div>

            <div className="mb-6 flex gap-2">
              <input
                className="border px-3 py-2 rounded flex-1"
                placeholder="Search movies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={() => fetchMovies(query)} className="px-3 py-2 bg-blue-500 text-white rounded">Search</button>
              <button onClick={() => { setQuery(""); fetchMovies(); }} className="px-3 py-2 bg-gray-200 rounded">Reset</button>
              <button onClick={requestSoftPrompt} className="px-3 py-2 bg-indigo-600 text-white rounded">Enable Notifications</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {loading ? <div className="col-span-full text-center">Loading…</div> :
                movies.map((m) => (
                  <div key={m.id} onClick={() => handleMovieClick(m)} className="cursor-pointer bg-white rounded shadow overflow-hidden">
                    {m.poster_path ? <img src={`https://image.tmdb.org/t/p/w300${m.poster_path}`} alt={m.title} className="w-full h-64 object-cover" />
                      : <div className="w-full h-64 bg-gray-200" />}
                    <div className="p-3 font-medium text-sm">{m.title}</div>
                  </div>
                ))}
            </div>
          </>
        )}

        {screen === "detail" && selectedMovie && (
          <DetailScreen movie={selectedMovie} onBack={() => setScreen("home")} />
        )}

        {screen === "profile" && (
          <ProfileScreen onClose={() => setScreen("home")} />
        )}
      </main>
    </div>
  );
}
