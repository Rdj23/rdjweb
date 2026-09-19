import React, { useMemo } from "react";
import { createRandom } from "../../lib/seed";

/**
 * A scannable-looking ticket code.
 *
 * This is a deterministic pattern derived from the booking reference, not a
 * real QR encoding - there is no ticketing backend for a scanner to validate
 * it against. It is stable per booking, so the same ticket always renders the
 * same code. Swap this for a real encoder if a gate scanner ever needs it.
 */
export default function TicketCode({ value, size = 132 }) {
  const modules = 21;
  const cells = useMemo(() => {
    const rand = createRandom(`qr|${value}`);
    const grid = Array.from({ length: modules }, () =>
      Array.from({ length: modules }, () => rand() > 0.52)
    );

    // Finder patterns in three corners, like the real thing.
    const stamp = (top, left) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const edge = r === 0 || r === 6 || c === 0 || c === 6;
          const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[top + r][left + c] = edge || core;
        }
      }
      // Quiet zone around each finder.
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = top + r;
          const cc = left + c;
          if (rr < 0 || cc < 0 || rr >= modules || cc >= modules) continue;
          if (r === -1 || r === 7 || c === -1 || c === 7) grid[rr][cc] = false;
        }
      }
    };
    stamp(0, 0);
    stamp(0, modules - 7);
    stamp(modules - 7, 0);
    return grid;
  }, [value]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${modules} ${modules}`}
      role="img"
      aria-label={`Ticket code ${value}`}
      shapeRendering="crispEdges"
      className="rounded-lg bg-white p-1"
    >
      {cells.map((row, r) =>
        row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0C0C11" /> : null))
      )}
    </svg>
  );
}
