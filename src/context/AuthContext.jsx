import React, { useCallback, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { updateProfileOnClevertap } from "../utils/cleverTap";
import { readJSON, writeJSON, removeKey, STORAGE_KEYS } from "../lib/storage";

export function AuthProvider({ children }) {
  const [identity, setIdentity] = useState(() => readJSON(STORAGE_KEYS.identity, "") || "");
  const [profile, setProfile] = useState(() => readJSON(STORAGE_KEYS.profile, {}) || {});

  const persist = useCallback((nextIdentity, nextProfile) => {
    writeJSON(STORAGE_KEYS.identity, nextIdentity);
    writeJSON(STORAGE_KEYS.profile, nextProfile);
    setIdentity(nextIdentity);
    setProfile(nextProfile);
  }, []);

  const login = useCallback(
    (rawIdentity) => {
      const id = String(rawIdentity).toLowerCase().trim();
      const nextProfile = {
        Name: id.split("@")[0] || "Guest",
        Identity: id,
        Email: id.includes("@") ? id : "",
      };
      updateProfileOnClevertap(nextProfile, true);
      persist(id, nextProfile);
    },
    [persist]
  );

  const signup = useCallback(
    ({ name, email, mobile }) => {
      const id = email.toLowerCase().trim();
      const nextProfile = {
        Name: name,
        Identity: id,
        Email: id,
        Phone: `+91${mobile}`,
      };
      updateProfileOnClevertap(nextProfile, true);
      persist(id, nextProfile);
    },
    [persist]
  );

  const logout = useCallback(() => {
    removeKey(STORAGE_KEYS.identity);
    removeKey(STORAGE_KEYS.profile);
    setIdentity("");
    setProfile({});
  }, []);

  const updateProfile = useCallback(
    (changes) => {
      const next = { ...profile, ...changes };
      // Marketing-channel opt-ins ride along with every explicit profile save.
      updateProfileOnClevertap({ ...changes, "MSG-email": true, "MSG-dndEmail": false });
      writeJSON(STORAGE_KEYS.profile, next);
      setProfile(next);
    },
    [profile]
  );

  const value = useMemo(
    () => ({
      identity,
      profile,
      isAuthenticated: Boolean(identity),
      login,
      signup,
      logout,
      updateProfile,
    }),
    [identity, profile, login, signup, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

