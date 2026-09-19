import { useEffect } from "react";

/** Scroll to the top on route change, the way a real page load would. */
export function useScrollTop(dep) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [dep]);
}
