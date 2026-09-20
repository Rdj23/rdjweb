// Languages offered as a profile preference, keyed by the ISO 639-1 codes TMDB
// uses for `with_original_language`, so a saved preference can drive a
// discover query directly. Indian languages first - this is an India-first
// booking app - then the widely-released world languages.

export const LANGUAGES_CATALOG = [
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "en", label: "English", native: "English" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "as", label: "Assamese", native: "অসমীয়া" },
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "zh", label: "Mandarin", native: "中文" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "it", label: "Italian", native: "Italiano" },
  { code: "pt", label: "Portuguese", native: "Português" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "tr", label: "Turkish", native: "Türkçe" },
  { code: "th", label: "Thai", native: "ไทย" },
  { code: "sv", label: "Swedish", native: "Svenska" },
  { code: "da", label: "Danish", native: "Dansk" },
  { code: "pl", label: "Polish", native: "Polski" },
];

const BY_CODE = new Map(LANGUAGES_CATALOG.map((l) => [l.code, l]));

export const languageByCode = (code) => BY_CODE.get(code) || null;

/** Human label for a TMDB original_language code, falling back to the code. */
export const languageLabel = (code) =>
  BY_CODE.get(code)?.label || (code ? code.toUpperCase() : "");
