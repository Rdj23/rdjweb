import { createContext, useContext } from "react";

// The context object and its hook live apart from the provider component so
// that AuthContext.jsx exports components only - Fast Refresh can't preserve
// state in a module that mixes the two.
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
