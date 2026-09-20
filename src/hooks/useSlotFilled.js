import { useEffect, useState } from "react";

/**
 * Report whether a CleverTap campaign has rendered into a slot.
 *
 * Native display injects into the slot element some time after mount, entirely
 * outside React. Watching the slot lets a section show its own content while
 * the slot is empty and step aside the moment a campaign fills it - so the page
 * is never blank in development, and never doubled up in production.
 */
export function useSlotFilled(ref) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const check = () => setFilled(el.childElementCount > 0);
    check();

    const observer = new MutationObserver(check);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [ref]);

  return filled;
}
