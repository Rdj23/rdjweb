import React, { useRef } from "react";
import { useSlotFilled } from "../../hooks/useSlotFilled";

/**
 * A CleverTap native display target.
 *
 * The slot element itself is always rendered and always empty — a campaign
 * injects into it by id, entirely outside React. `children` are a stand-in
 * shown only while the slot is empty, so the page reads correctly before any
 * campaign is live and never shows both at once after one goes live.
 *
 * Pass no children for a slot that should stay blank regardless.
 */
export default function NativeSlot({ id, children, className = "", slotClassName = "" }) {
  const ref = useRef(null);
  const filled = useSlotFilled(ref);

  return (
    <div className={className}>
      <div ref={ref} id={id} data-ct-slot={id} className={slotClassName} />
      {!filled && children}
    </div>
  );
}
