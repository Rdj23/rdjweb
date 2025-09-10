import React, { useEffect, useState } from "react";

const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "";

export default function App() {
  const [screen, setScreen] = useState("login");
  const [email, setEmail] = useState("");
  const [identity, setIdentity] = useState("");
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Page Viewed event when Home loads
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
    const res = await fetch(url);
    const data = await res.json();
    setMovies(data.results || []);
    setLoading(false);
  }

  function handleLogin(e) {
    e.preventDefault();
    if (!email) return;

    const id = email.toLowerCase().trim();

    const siteProfile = {
      Name: email.split("@")[0] || "User",
      Identity: id,
      Email: id,
      "MSG-push": true,
    };

    clevertap.onUserLogin.push({ Site: siteProfile });
    

    setIdentity(id);
    setScreen("home");
  }

  function handleMovieClick(m) {
    clevertap.event.push("Movie Clicked", {
      id: String(m.id),
      title: m.title || "",
    });
  }

  function requestSoftPrompt() {
    clevertap.notifications.push([
     
      {
        titleText: "Turn On Notifications?",
        bodyText: "We will only send you relevant and useful updates.",
        okButtonText: "Allow",
        rejectButtonText: "Later",
        okButtonColor: "#0b82ff",
        askAgainTimeInSeconds: 30,
        serviceWorkerPath: "/clevertap_sw.js",
      },
    ]);
  }

  return (
    <div className="min-h-screen font-sans bg-gray-50">
      <nav className="bg-white shadow px-4 py-3 flex justify-between">
        <div className="font-bold">Movies Demo</div>
        {screen === "home" && (
          <div className="flex gap-4 items-center">
            <span>User: {identity}</span>
            <button
              onClick={requestSoftPrompt}
              className="px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Enable Notifications
            </button>
          </div>
        )}
      </nav>

      <main className="p-6 max-w-5xl mx-auto">
        {screen === "login" ? (
          <form
            onSubmit={handleLogin}
            className="space-y-4 max-w-md mx-auto bg-white p-6 rounded shadow"
          >
            <h2 className="text-xl font-semibold">Login</h2>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
            />
            <button className="px-4 py-2 bg-indigo-600 text-white rounded">
              Sign In
            </button>
          </form>
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              <input
                className="border px-3 py-2 rounded flex-1"
                placeholder="Search movies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                onClick={() => fetchMovies(query)}
                className="px-3 py-2 bg-blue-500 text-white rounded"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setQuery("");
                  fetchMovies();
                }}
                className="px-3 py-2 bg-gray-200 rounded"
              >
                Reset
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {loading ? (
                <div className="col-span-full text-center">Loading…</div>
              ) : (
                movies.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleMovieClick(m)}
                    className="cursor-pointer bg-white rounded shadow overflow-hidden"
                  >
                    {m.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                        alt={m.title}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-200" />
                    )}
                    <div className="p-3 font-medium text-sm">{m.title}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
