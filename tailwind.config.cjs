/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Near-black cinema surfaces, warm-neutral rather than blue-black
        ink: {
          950: "#08080B",
          900: "#0C0C11",
          850: "#12121A",
          800: "#181822",
          750: "#1F1F2B",
          700: "#282836",
          600: "#353546",
          500: "#4A4A5E",
          400: "#6C6C82",
          300: "#9A9AB0",
          200: "#C6C6D4",
          100: "#E7E7EE",
        },
        brand: {
          DEFAULT: "#F5B31C",
          50: "#FEF7E4",
          100: "#FDECBE",
          200: "#FBDB84",
          300: "#F8C94B",
          400: "#F5B31C",
          500: "#DE9B0A",
          600: "#B27A06",
          700: "#7E5604",
        },
        crimson: {
          DEFAULT: "#E1344B",
          400: "#EF5568",
          500: "#E1344B",
          600: "#BC2036",
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: "0 18px 40px -20px rgba(0, 0, 0, 0.85)",
        glow: "0 0 0 1px rgba(245, 179, 28, 0.35), 0 10px 30px -12px rgba(245, 179, 28, 0.45)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
