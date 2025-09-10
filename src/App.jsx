import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Topbar from "./components/Topbar";
import HomePage from "./pages/HomePage";
import MovieDetailPage from "./pages/MovieDetailPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";

const clevertap = window.clevertap;

export default function App() {
  const [identity, setIdentity] = useState(() => localStorage.getItem("user_identity") || "");
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem("user_profile");
    return savedProfile ? JSON.parse(savedProfile) : {};
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!identity && window.location.pathname !== '/login') {
      navigate("/login");
    }
  }, [identity, navigate]);

  const handleLogin = (id) => {
    const userProfile = {
      Name: id.split("@")[0] || "User",
      Identity: id,
      Email: id,
    };
    clevertap.onUserLogin.push({ Site: userProfile });
    
    localStorage.setItem("user_identity", id);
    localStorage.setItem("user_profile", JSON.stringify(userProfile));
    setIdentity(id);
    setProfile(userProfile);
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("user_identity");
    localStorage.removeItem("user_profile");
    setIdentity("");
    setProfile({});
  };

  const handleProfileUpdate = (updatedProfile) => {
    clevertap.profile.push({ Site: updatedProfile });
    
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
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/movie/:movieId" element={<MovieDetailPage />} />
          <Route 
            path="/profile" 
            element={
              <ProfilePage 
                identity={identity} 
                profile={profile}
                onLogout={handleLogout}
                onProfileUpdate={handleProfileUpdate}
              />
            } 
          />
        </Routes>
      </main>
    </div>
  );
}
