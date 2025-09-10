import React, { useState, useEffect } from "react";

export default function ProfilePage({ identity, profile, onLogout, onProfileUpdate }) {
  // Use local component state for the form inputs, initialized from props
  const [name, setName] = useState(profile.Name || "");
  const [mobile, setMobile] = useState(profile.Phone || "");
  const [favGenre, setFavGenre] = useState(profile.FavGenre || "");
  const [error, setError] = useState("");

  // When the profile prop changes (e.g., on re-login), update the form
  useEffect(() => {
    setName(profile.Name || "");
    setMobile(profile.Phone || "");
    setFavGenre(profile.FavGenre || "");
  }, [profile]);


  const validateAndSetMobile = (value) => {
    const sanitizedValue = value.replace(/[^0-9+]/g, '');
    setMobile(sanitizedValue);
    if (sanitizedValue && !/^\+91[0-9]{10}$/.test(sanitizedValue)) {
      setError("Phone number must be in the format +91XXXXXXXXXX");
    } else {
      setError("");
    }
  };
  
  function handleSave() {
    if (error) {
      alert("Please fix the errors before saving.");
      return;
    }
    const updatedProfile = {
      Name: name,
      Phone: mobile,
      FavGenre: favGenre,
    };
    // Send the updated data up to the App component
    onProfileUpdate(updatedProfile);
  }

  return (
    <div className="w-full max-w-md p-8 mx-auto space-y-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center text-gray-800">Your Profile</h2>
      <div className="text-center text-gray-600">Email: {identity}</div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-gray-700">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 mt-1 text-gray-800 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="mobile" className="text-sm font-medium text-gray-700">Mobile Number</label>
          <input
            id="mobile"
            value={mobile}
            onChange={(e) => validateAndSetMobile(e.target.value)}
            placeholder="+919876543210"
            className={`w-full px-3 py-2 mt-1 text-gray-800 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <div>
          <label htmlFor="favGenre" className="text-sm font-medium text-gray-700">Favorite Genre</label>
          <input
            id="favGenre"
            value={favGenre}
            onChange={(e) => setFavGenre(e.target.value)}
            placeholder="e.g., Sci-Fi, Thriller"
            className="w-full px-3 py-2 mt-1 text-gray-800 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Save Profile
        </button>
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
