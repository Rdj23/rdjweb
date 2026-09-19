import React from "react";
import { Link } from "react-router-dom";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 " +
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 select-none";

const variants = {
  primary:
    "bg-brand-400 text-ink-950 hover:bg-brand-300 active:bg-brand-500 shadow-glow hover:-translate-y-0.5",
  secondary:
    "bg-ink-750 text-ink-100 border border-ink-600 hover:bg-ink-700 hover:border-ink-500",
  ghost: "text-ink-200 hover:text-white hover:bg-ink-800",
  danger: "bg-crimson-500 text-white hover:bg-crimson-400",
  outline: "border border-brand-400/60 text-brand-300 hover:bg-brand-400/10",
};

const sizes = {
  sm: "text-xs px-3 py-2",
  md: "text-sm px-5 py-2.5",
  lg: "text-base px-7 py-3.5",
};

export default function Button({
  as,
  to,
  variant = "primary",
  size = "md",
  className = "",
  fullWidth = false,
  children,
  ...props
}) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`;
  const Component = as || (to ? Link : "button");
  const extra = Component === "button" ? { type: props.type || "button" } : {};
  return (
    <Component to={to} className={classes} {...extra} {...props}>
      {children}
    </Component>
  );
}
