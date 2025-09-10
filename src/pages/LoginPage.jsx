import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();
    if (!email) return alert("Enter email");
    const id = email.toLowerCase().trim();
    onLogin(id);
    // The navigation will be handled by the App component after the state is set
  }

  return (
    <form
      onSubmit={handleLogin}
      className="max-w-md mx-auto bg-white p-6 rounded shadow"
    >
      <h2 className="text-xl font-semibold mb-4">Sign in</h2>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border px-3 py-2 rounded mb-4"
        required
      />
      <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded">
        Sign In
      </button>
    </form>
  );
}
