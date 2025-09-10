import React from "react";
import { Link } from "react-router-dom";

export default function Topbar({ identity }) {
  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-bold text-indigo-600">
            MoviesDB
          </Link>
          {identity && (
            <div className="flex items-center gap-4">
              <Link
                to="/profile"
                title="Profile"
                className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold hover:bg-gray-300 transition-colors"
              >
                {identity[0]?.toUpperCase()}
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
