import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Topbar from "./components/Topbar";
import HomePage from "./pages/HomePage";
import MovieDetailPage from "./pages/MovieDetailPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import { updateProfileOnClevertap } from "./utils/cleverTap";

// Gate content behind an authenticated identity - unauthenticated visitors
// are sent to /login instead of silently browsing/buying as "Guest".
function RequireAuth({ identity, children }) {
  const location = useLocation();
  if (!identity) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

// Bounce straight back home if a user who's already signed in lands on
// /login directly. Whether to redirect is decided once, from the identity
// at mount time - if we kept re-checking the live `identity` prop, this
// would fire (and stomp the intended post-login destination) at the exact
// moment handleLogin/handleSignup flips identity from empty to set.
function LoginRoute({ identity, onLogin, onSignup }) {
  const [wasAlreadyAuthed] = useState(() => Boolean(identity));
  if (wasAlreadyAuthed) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage onLogin={onLogin} onSignup={onSignup} />;
}

export default function App() {
  const [identity, setIdentity] = useState(() => localStorage.getItem("user_identity") || "");
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem("user_profile");
    return savedProfile ? JSON.parse(savedProfile) : {};
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Where to send the user once they're signed in - the page they were
  // trying to act on (e.g. buy/wishlist a specific movie) when they were
  // bounced to /login, or "/" if they navigated to /login directly.
  const postLoginDestination = location.state?.from || "/";

  const handleLogin = (id) => {
    const userProfile = {
      Name: id.split("@")[0] || "User",
      Identity: id,
      Email: id,
    };
    updateProfileOnClevertap(userProfile, true);

    localStorage.setItem("user_identity", id);
    localStorage.setItem("user_profile", JSON.stringify(userProfile));
    setIdentity(id);
    setProfile(userProfile);
    navigate(postLoginDestination);
  };

  const handleSignup = ({ name, email, mobile }) => {
    const id = email.toLowerCase().trim();
    const userProfile = {
      Name: name,
      Identity: id,
      Email: email,
      Phone: `+91${mobile}`,
    };
    updateProfileOnClevertap(userProfile, true);

    localStorage.setItem("user_identity", id);
    localStorage.setItem("user_profile", JSON.stringify(userProfile));
    setIdentity(id);
    setProfile(userProfile);
    navigate(postLoginDestination);
  };

  const handleLogout = () => {
    localStorage.removeItem("user_identity");
    localStorage.removeItem("user_profile");
    setIdentity("");
    setProfile({});
    navigate("/login");
  };

  const handleProfileUpdate = (updatedProfile) => {
    const payloadWithDefaults = {
      ...updatedProfile,
      "MSG-email": true,
      "MSG-dndEmail": false,
    };
    updateProfileOnClevertap(payloadWithDefaults);

    // Update the master profile state in App
    const newProfile = { ...profile, ...updatedProfile };
    setProfile(newProfile);
    localStorage.setItem("user_profile", JSON.stringify(newProfile));

    alert("Profile updated successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar identity={identity} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <Routes>
          <Route
            path="/login"
            element={
              <LoginRoute identity={identity} onLogin={handleLogin} onSignup={handleSignup} />
            }
          />
          <Route path="/" element={<HomePage />} />
          <Route
            path="/movie/:movieId"
            element={<MovieDetailPage identity={identity} profile={profile} />}
          />
          <Route
            path="/profile"
            element={
              <RequireAuth identity={identity}>
                <ProfilePage
                  identity={identity}
                  profile={profile}
                  onLogout={handleLogout}
                  onProfileUpdate={handleProfileUpdate}
                />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
