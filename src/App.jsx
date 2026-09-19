import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import Topbar from "./components/layout/Topbar";
import Footer from "./components/layout/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageLoader } from "./components/ui/States";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/auth-context";
import { BookingProvider } from "./context/BookingContext";
import HomePage from "./pages/HomePage";

// Home ships in the main bundle; every other route is split out, so the first
// paint doesn't carry the seat map, checkout or ticket code along with it.
const BrowsePage = lazy(() => import("./pages/BrowsePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const TitleDetailPage = lazy(() => import("./pages/TitleDetailPage"));
const ShowtimesPage = lazy(() => import("./pages/ShowtimesPage"));
const SeatsPage = lazy(() => import("./pages/SeatsPage"));
const PassPage = lazy(() => import("./pages/PassPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const BookingsPage = lazy(() => import("./pages/BookingsPage"));
const TicketPage = lazy(() => import("./pages/TicketPage"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

/**
 * Send unauthenticated visitors to sign in, remembering where they were headed
 * so checkout resumes exactly where it left off.
 *
 * Browsing is deliberately open - only paying, and anything tied to a personal
 * profile, needs an identity behind it.
 */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
    );
  }
  return children;
}

/** Redirect visitors who are already signed in away from /login. */
function LoginRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) {
    return <Navigate to={location.state?.from || "/"} replace />;
  }
  return <LoginPage />;
}

// Bookmarks and CleverTap campaigns still point at the old /movie/:id URLs.
function LegacyMovieRedirect() {
  const { movieId } = useParams();
  return <Navigate to={`/title/movie/${movieId}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <div className="flex min-h-screen flex-col bg-ink-950">
          <Topbar />

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/movies" element={<BrowsePage mediaType="movie" />} />
                  <Route path="/series" element={<BrowsePage mediaType="tv" />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/title/:type/:id" element={<TitleDetailPage />} />

                  <Route path="/book/movie/:id/shows" element={<ShowtimesPage />} />
                  <Route path="/book/movie/:id/seats/:showId" element={<SeatsPage />} />
                  <Route path="/book/tv/:id/pass" element={<PassPage />} />

                  <Route
                    path="/checkout"
                    element={
                      <RequireAuth>
                        <CheckoutPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/bookings"
                    element={
                      <RequireAuth>
                        <BookingsPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/bookings/:bookingId"
                    element={
                      <RequireAuth>
                        <TicketPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/watchlist"
                    element={
                      <RequireAuth>
                        <WatchlistPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <RequireAuth>
                        <ProfilePage />
                      </RequireAuth>
                    }
                  />

                  <Route path="/login" element={<LoginRoute />} />
                  <Route path="/movie/:movieId" element={<LegacyMovieRedirect />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>

          <Footer />
        </div>
      </BookingProvider>
    </AuthProvider>
  );
}
