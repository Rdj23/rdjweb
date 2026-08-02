import React, { useState } from "react";

export default function LoginPage({ onLogin, onSignup }) {
  const [mode, setMode] = useState("signup");

  // Sign In state (returning users)
  const [identity, setIdentity] = useState("");
  const [identityType, setIdentityType] = useState("mobile");

  // Sign Up state (new users)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  const placeholders = {
    mobile: "Enter 10-digit mobile number",
    email: "Enter email or identity",
    crn: "Enter CRN number",
  };

  function handleLogin(e) {
    e.preventDefault();
    if (!identity) return alert(`Enter ${identityType}`);
    onLogin(identity.toLowerCase().trim());
  }

  const isSignupValid =
    name.trim() !== "" &&
    email.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    /^\d{10}$/.test(mobile);

  function handleSignup(e) {
    e.preventDefault();
    if (!isSignupValid) return;
    onSignup({ name: name.trim(), email: email.trim(), mobile });
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <div className="flex mb-6 border-b">
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-colors ${
            mode === "signup"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 pb-2 text-sm font-semibold border-b-2 transition-colors ${
            mode === "signin"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Sign In
        </button>
      </div>

      {mode === "signup" ? (
        <form onSubmit={handleSignup} className="space-y-4">
          <h2 className="text-xl font-semibold">Create your account</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border px-3 py-2 rounded"
              required
            />
            {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
              <p className="text-red-500 text-xs mt-1">Enter a valid email address</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 rounded-l bg-gray-50 text-gray-500 text-sm">
                +91
              </span>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                className="w-full border px-3 py-2 rounded-r"
                required
              />
            </div>
            {mobile && !/^\d{10}$/.test(mobile) && (
              <p className="text-red-500 text-xs mt-1">Enter a valid 10-digit mobile number</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isSignupValid}
            className={`w-full px-4 py-2 rounded text-white font-semibold ${
              isSignupValid ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Sign Up
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin}>
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
      )}
    </div>
  );
}
