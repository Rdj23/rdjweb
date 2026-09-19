// Static venue catalog. Cinemas never change, so they are plain data; only
// which of them carry a given title, and at what times, is generated per title.

export const CITIES = [
  { id: "mumbai", name: "Mumbai" },
  { id: "delhi", name: "Delhi NCR" },
  { id: "bengaluru", name: "Bengaluru" },
  { id: "hyderabad", name: "Hyderabad" },
  { id: "pune", name: "Pune" },
  { id: "chennai", name: "Chennai" },
  { id: "kolkata", name: "Kolkata" },
];

export const DEFAULT_CITY = "mumbai";

// `tier` scales ticket prices: 2 = premium multiplex, 1 = standard, 0 = value.
export const CINEMAS = {
  mumbai: [
    { id: "mum-pvr-phoenix", brand: "PVR ICON", name: "Phoenix Palladium", area: "Lower Parel", tier: 2 },
    { id: "mum-inox-nariman", brand: "INOX", name: "Nariman Point", area: "Churchgate", tier: 2 },
    { id: "mum-cinepolis-andheri", brand: "Cinepolis", name: "Infiniti Mall", area: "Andheri West", tier: 1 },
    { id: "mum-carnival-wadala", brand: "Carnival", name: "Imax Wadala", area: "Wadala", tier: 1 },
    { id: "mum-maratha-mandir", brand: "Maratha Mandir", name: "Mumbai Central", area: "Mumbai Central", tier: 0 },
    { id: "mum-pvr-juhu", brand: "PVR", name: "Dynamix Mall", area: "Juhu", tier: 1 },
  ],
  delhi: [
    { id: "del-pvr-saket", brand: "PVR Director's Cut", name: "Select Citywalk", area: "Saket", tier: 2 },
    { id: "del-inox-nehru", brand: "INOX", name: "Nehru Place", area: "Nehru Place", tier: 1 },
    { id: "del-pvr-vasant", brand: "PVR", name: "Vasant Square", area: "Vasant Kunj", tier: 1 },
    { id: "del-cinepolis-noida", brand: "Cinepolis", name: "Mall of India", area: "Noida", tier: 2 },
    { id: "del-wave-rajouri", brand: "Wave", name: "Raja Garden", area: "Rajouri Garden", tier: 0 },
  ],
  bengaluru: [
    { id: "blr-pvr-forum", brand: "PVR", name: "Forum Mall", area: "Koramangala", tier: 2 },
    { id: "blr-inox-garuda", brand: "INOX", name: "Garuda Mall", area: "Magrath Road", tier: 1 },
    { id: "blr-urvashi", brand: "Urvashi", name: "Urvashi Theatre", area: "Lalbagh Road", tier: 0 },
    { id: "blr-cinepolis-royal", brand: "Cinepolis", name: "Royal Meenakshi", area: "Bannerghatta", tier: 1 },
    { id: "blr-pvr-orion", brand: "PVR", name: "Orion Mall", area: "Rajajinagar", tier: 2 },
  ],
  hyderabad: [
    { id: "hyd-prasads", brand: "Prasads", name: "Large Screen IMAX", area: "Necklace Road", tier: 2 },
    { id: "hyd-aaa", brand: "AAA Cinemas", name: "Ameerpet", area: "Ameerpet", tier: 1 },
    { id: "hyd-inox-gvk", brand: "INOX", name: "GVK One", area: "Banjara Hills", tier: 2 },
    { id: "hyd-asian-miraj", brand: "Asian Miraj", name: "Attapur", area: "Attapur", tier: 0 },
  ],
  pune: [
    { id: "pnq-pvr-phoenix", brand: "PVR", name: "Phoenix Marketcity", area: "Viman Nagar", tier: 2 },
    { id: "pnq-inox-bund", brand: "INOX", name: "Bund Garden", area: "Bund Garden", tier: 1 },
    { id: "pnq-city-pride", brand: "City Pride", name: "Kothrud", area: "Kothrud", tier: 0 },
    { id: "pnq-cinepolis-seasons", brand: "Cinepolis", name: "Seasons Mall", area: "Magarpatta", tier: 1 },
  ],
  chennai: [
    { id: "maa-sathyam", brand: "Rohini Silver Screens", name: "Koyambedu", area: "Koyambedu", tier: 1 },
    { id: "maa-pvr-ampa", brand: "PVR", name: "Ampa Skywalk", area: "Aminjikarai", tier: 2 },
    { id: "maa-inox-chennai", brand: "INOX", name: "Chennai Citi Centre", area: "Mylapore", tier: 1 },
    { id: "maa-kamala", brand: "Kamala Cinemas", name: "Vadapalani", area: "Vadapalani", tier: 0 },
  ],
  kolkata: [
    { id: "ccu-inox-quest", brand: "INOX", name: "Quest Mall", area: "Ballygunge", tier: 2 },
    { id: "ccu-pvr-mani", brand: "PVR", name: "Mani Square", area: "Kankurgachi", tier: 1 },
    { id: "ccu-nandan", brand: "Nandan", name: "Nandan Complex", area: "Rabindra Sadan", tier: 0 },
    { id: "ccu-cinepolis-lake", brand: "Cinepolis", name: "Lake Mall", area: "Rashbehari", tier: 1 },
  ],
};

// Format keys stay slug-safe because they are embedded in show ids and URLs.
export const FORMATS = {
  "2d": { label: "2D", multiplier: 1, badge: "2D" },
  "3d": { label: "3D", multiplier: 1.2, badge: "3D" },
  imax: { label: "IMAX 2D", multiplier: 1.6, badge: "IMAX" },
  dolby: { label: "Dolby Cinema", multiplier: 1.35, badge: "DOLBY" },
  "4dx": { label: "4DX", multiplier: 1.75, badge: "4DX" },
};

export const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu"];

export const SEAT_TIERS = {
  classic: { key: "classic", label: "Classic", basePrice: 170, rows: ["A", "B", "C", "D"], seatsPerRow: 20 },
  prime: { key: "prime", label: "Prime", basePrice: 260, rows: ["E", "F", "G", "H", "J"], seatsPerRow: 20 },
  recliner: { key: "recliner", label: "Recliner", basePrice: 430, rows: ["K", "L"], seatsPerRow: 12 },
};

export const TIER_ORDER = ["recliner", "prime", "classic"];

export const cinemasForCity = (cityId) => CINEMAS[cityId] || CINEMAS[DEFAULT_CITY];

export const findCinema = (cityId, cinemaId) =>
  cinemasForCity(cityId).find((c) => c.id === cinemaId) || null;

export const cityName = (cityId) => CITIES.find((c) => c.id === cityId)?.name || "Mumbai";
