import { useCallback, useEffect, useRef, useState } from "react";
import { isAbort } from "../lib/tmdb";

/**
 * Run a TMDB request tied to component lifetime.
 *
 * `fetcher` receives an AbortSignal; navigating away or changing the deps
 * aborts the in-flight request so a slow response can't overwrite fresh state.
 *
 * @param {(signal: AbortSignal) => Promise<any>} fetcher
 * @param {Array} deps   re-run when these change
 * @param {{enabled?: boolean}} options
 */
export function useTmdb(fetcher, deps, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const [reloadToken, setReloadToken] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (active) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!active || isAbort(error)) return;
        setState({ data: null, loading: false, error });
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return { ...state, reload };
}

/** Debounce a rapidly changing value - used to keep search to one request per pause. */
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

