import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ onLogin }) {
  const [identity, setIdentity] = useState("");
  const [identityType, setIdentityType] = useState("mobile");
  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();
    if (!identity) return alert(`Enter ${identityType}`);
    const id = identity.toLowerCase().trim();
    onLogin(id);
    // The navigation will be handled by the App component after the state is set
  }

  const placeholders = {
    mobile: "Enter 10-digit mobile number",
    email: "Enter email or identity",
    crn: "Enter CRN number"
  };

  return (
    <form
      onSubmit={handleLogin}
      className="max-w-md mx-auto bg-white p-6 rounded shadow"
    >
      <h2 className="text-xl font-semibold mb-4">Sign In</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Login Type</label>
        <select
          value={identityType}
          onChange={(e) => setIdentityType(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="mobile">Mobile Number</option>
          <option value="email">Email / Identity</option>
          <option value="crn">CRN Number</option>
        </select>
      </div>

      <input
        type="text"
        placeholder={placeholders[identityType]}
        value={identity}
        onChange={(e) => setIdentity(e.target.value)}
        className="w-full border px-3 py-2 rounded mb-4"
        required
      />
      <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded">
        Sign In
      </button>
    </form>
  );
}
