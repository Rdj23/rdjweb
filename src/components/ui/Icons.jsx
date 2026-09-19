// Hand-rolled icon set: a handful of 24px strokes weigh far less than pulling
// in an icon package, and they inherit currentColor like text.
import React from "react";

const Svg = ({ children, size = 20, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {children}
  </svg>
);

export const IconSearch = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
);
export const IconTicket = (p) => (
  <Svg {...p}>
    <path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6Z" />
    <path d="M13 5v2M13 11v2M13 17v2" strokeDasharray="0.1 3.5" />
  </Svg>
);
export const IconHeart = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20s-7-4.35-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.65 12 20 12 20Z" />
  </Svg>
);
export const IconStar = (p) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <path d="m12 3.6 2.47 5.02 5.53.8-4 3.9.95 5.52L12 16.24l-4.95 2.6.95-5.52-4-3.9 5.53-.8Z" />
  </Svg>
);
export const IconPin = (p) => (
  <Svg {...p}><path d="M12 21s-6.5-5.5-6.5-10a6.5 6.5 0 1 1 13 0c0 4.5-6.5 10-6.5 10Z" /><circle cx="12" cy="11" r="2.4" /></Svg>
);
export const IconChevronDown = (p) => (<Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>);
export const IconChevronLeft = (p) => (<Svg {...p}><path d="m14 6-6 6 6 6" /></Svg>);
export const IconChevronRight = (p) => (<Svg {...p}><path d="m10 6 6 6-6 6" /></Svg>);
export const IconClose = (p) => (<Svg {...p}><path d="M6 6 18 18M18 6 6 18" /></Svg>);
export const IconPlay = (p) => (
  <Svg {...p} fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5Z" /></Svg>
);
export const IconCheck = (p) => (<Svg {...p}><path d="m4.5 12.5 5 5 10-11" /></Svg>);
export const IconUser = (p) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>
);
export const IconCalendar = (p) => (
  <Svg {...p}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 10h17M8 3.5v3M16 3.5v3" /></Svg>
);
export const IconClock = (p) => (<Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>);
export const IconFilm = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M7.5 4v16M16.5 4v16M3 12h18M3 8h4.5M16.5 8H21M3 16h4.5M16.5 16H21" />
  </Svg>
);
export const IconSparkle = (p) => (
  <Svg {...p}><path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9-5.7-1.8L10.2 9Z" /></Svg>
);
export const IconAlert = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V13M12 16.2v.2" /></Svg>
);
export const IconLogout = (p) => (
  <Svg {...p}><path d="M14 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8M17 15l3-3-3-3M20 12H10" /></Svg>
);
export const IconDownload = (p) => (
  <Svg {...p}><path d="M12 4v11M8 11l4 4 4-4M5 20h14" /></Svg>
);
