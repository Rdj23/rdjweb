import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import { IconTicket } from "../components/ui/Icons";
import { useAuth } from "../context/auth-context";
import { trackPageView } from "../lib/analytics";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const identityPlaceholders = {
  mobile: "10-digit mobile number",
  email: "Email or identity",
  crn: "CRN number",
};

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("signup");

  const [identity, setIdentity] = useState("");
  const [identityType, setIdentityType] = useState("mobile");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  // Where to land after authenticating: whatever the user was trying to reach.
  const destination = location.state?.from || "/";

  useEffect(() => {
    trackPageView("Login");
  }, []);

  const signupValid = name.trim().length > 1 && EMAIL_RE.test(email.trim()) && /^\d{10}$/.test(mobile);
  const signinValid = identity.trim().length > 2;

  const handleSignup = (e) => {
    e.preventDefault();
    if (!signupValid) return;
    signup({ name: name.trim(), email: email.trim(), mobile });
    navigate(destination, { replace: true });
  };

  const handleSignin = (e) => {
    e.preventDefault();
    if (!signinValid) return;
    login(identity);
    navigate(destination, { replace: true });
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-4">
      <div className="text-center">
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-400 text-ink-950">
          <IconTicket size={24} />
        </span>
        <h1 className="text-2xl font-black text-white">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          {destination === "/"
            ? "Sign in to book tickets, buy passes and keep a watchlist."
            : "Sign in to continue with your booking."}
        </p>
      </div>

      <div className="surface overflow-hidden">
        <div className="grid grid-cols-2">
          {[
            { key: "signup", label: "Sign up" },
            { key: "signin", label: "Sign in" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMode(tab.key)}
              aria-pressed={mode === tab.key}
              className={`border-b-2 py-3 text-sm font-semibold transition-colors ${
                mode === tab.key
                  ? "border-brand-400 bg-brand-400/5 text-brand-300"
                  : "border-transparent text-ink-400 hover:text-ink-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {mode === "signup" ? (
            <form onSubmit={handleSignup} className="space-y-4" noValidate>
              <Field
                label="Full name"
                value={name}
                onChange={setName}
                placeholder="Your name"
                autoComplete="name"
                required
              />
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                required
                error={email && !EMAIL_RE.test(email) ? "Enter a valid email address" : null}
              />

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-200">
                  Mobile number <span className="text-crimson-400">*</span>
                </span>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 border-ink-750 bg-ink-800 px-3 text-sm text-ink-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full rounded-r-xl border border-ink-750 bg-ink-900 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:border-brand-400/60"
                  />
                </div>
                {mobile && !/^\d{10}$/.test(mobile) && (
                  <span className="mt-1 block text-xs text-crimson-400">
                    Enter all 10 digits
                  </span>
                )}
              </label>

              <Button type="submit" fullWidth size="lg" disabled={!signupValid}>
                Create account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignin} className="space-y-4" noValidate>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-200">Sign in with</span>
                <select
                  value={identityType}
                  onChange={(e) => {
                    setIdentityType(e.target.value);
                    setIdentity("");
                  }}
                  className="w-full rounded-xl border border-ink-750 bg-ink-900 px-3.5 py-2.5 text-sm text-ink-100 focus:border-brand-400/60"
                >
                  <option value="mobile">Mobile number</option>
                  <option value="email">Email / identity</option>
                  <option value="crn">CRN number</option>
                </select>
              </label>

              <Field
                label="Your identity"
                value={identity}
                onChange={setIdentity}
                placeholder={identityPlaceholders[identityType]}
                required
              />

              <Button type="submit" fullWidth size="lg" disabled={!signinValid}>
                Sign in
              </Button>
            </form>
          )}
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-ink-600">
        This is a demo. Any details you enter are stored in your browser and sent to CleverTap as
        profile data — don't use real credentials.
      </p>
    </div>
  );
}

