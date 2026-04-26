export type ThemeMode =
  | "light"
  | "dark"
  | "ocean"
  | "violet"
  | "sunset"
  | "spring"
  | "summer"
  | "autumn"
  | "winter"
  | "aurora";

type SeasonMode = "none" | "spring" | "summer" | "autumn" | "winter";

type ThemeDef = {
  name: string;
  season: SeasonMode;
  colors: {
    bg: string;
    bgSecondary: string;
    text: string;
    textSecondary: string;
    border: string;

    primary: string;
    primaryDark: string;
    primarySoft: string;
    primarySoftBorder: string;

    accent: string;
    accentDark: string;
    accentSoft: string;
    accentSoftBorder: string;

    error: string;
    errorSoft: string;
    errorSoftBorder: string;

    muted: string;
    mutedText: string;
    darkSurface: string;
    white: string;

    cardGradient: string;
    cardGlow: string;
    cardShadow: string;
    cardDecor: string;

    seasonOverlay: string;
    seasonParticle: string;
    seasonParticleSoft: string;
  };
};

export const themes: Record<ThemeMode, ThemeDef> = {
  light: {
    name: "Light",
    season: "none",
    colors: {
      bg: "#f5f5f0",
      bgSecondary: "#ffffff",
      text: "#1a1a1a",
      textSecondary: "#6b7280",
      border: "#e5e7eb",

      primary: "#16a34a",
      primaryDark: "#15803d",
      primarySoft: "#f0fdf4",
      primarySoftBorder: "#bbf7d0",

      accent: "#f59e0b",
      accentDark: "#d97706",
      accentSoft: "#fef3c7",
      accentSoftBorder: "#fcd34d",

      error: "#ef4444",
      errorSoft: "#fef2f2",
      errorSoftBorder: "#fecaca",

      muted: "#f3f4f6",
      mutedText: "#9ca3af",
      darkSurface: "#111827",
      white: "#ffffff",

      cardGradient: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      cardGlow: "rgba(22, 163, 74, 0.18)",
      cardShadow: "rgba(15, 23, 42, 0.1)",
      cardDecor: "rgba(22, 163, 74, 0.12)",

      seasonOverlay: "transparent",
      seasonParticle: "transparent",
      seasonParticleSoft: "transparent",
    },
  },

  dark: {
    name: "Dark",
    season: "none",
    colors: {
      bg: "#0f172a",
      bgSecondary: "#1e293b",
      text: "#f1f5f9",
      textSecondary: "#cbd5e1",
      border: "#334155",

      primary: "#22c55e",
      primaryDark: "#16a34a",
      primarySoft: "#052e16",
      primarySoftBorder: "#166534",

      accent: "#fbbf24",
      accentDark: "#d97706",
      accentSoft: "#451a03",
      accentSoftBorder: "#92400e",

      error: "#fb7185",
      errorSoft: "#4c0519",
      errorSoftBorder: "#9f1239",

      muted: "#1f2937",
      mutedText: "#94a3b8",
      darkSurface: "#020617",
      white: "#ffffff",

      cardGradient: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
      cardGlow: "rgba(34, 197, 94, 0.16)",
      cardShadow: "rgba(0, 0, 0, 0.35)",
      cardDecor: "rgba(255, 255, 255, 0.08)",

      seasonOverlay: "transparent",
      seasonParticle: "transparent",
      seasonParticleSoft: "transparent",
    },
  },

  ocean: {
    name: "Ocean",
    season: "none",
    colors: {
      bg: "#f3f8ff",
      bgSecondary: "#ffffff",
      text: "#0f172a",
      textSecondary: "#64748b",
      border: "#dbeafe",

      primary: "#2563eb",
      primaryDark: "#1d4ed8",
      primarySoft: "#eff6ff",
      primarySoftBorder: "#bfdbfe",

      accent: "#06b6d4",
      accentDark: "#0891b2",
      accentSoft: "#ecfeff",
      accentSoftBorder: "#a5f3fc",

      error: "#ef4444",
      errorSoft: "#fef2f2",
      errorSoftBorder: "#fecaca",

      muted: "#e2e8f0",
      mutedText: "#64748b",
      darkSurface: "#0f172a",
      white: "#ffffff",

      cardGradient: "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)",
      cardGlow: "rgba(37, 99, 235, 0.18)",
      cardShadow: "rgba(37, 99, 235, 0.14)",
      cardDecor: "rgba(6, 182, 212, 0.14)",

      seasonOverlay: "transparent",
      seasonParticle: "transparent",
      seasonParticleSoft: "transparent",
    },
  },

  violet: {
    name: "Violet",
    season: "none",
    colors: {
      bg: "#faf7ff",
      bgSecondary: "#ffffff",
      text: "#1f1630",
      textSecondary: "#7c6f99",
      border: "#eadcff",

      primary: "#7c3aed",
      primaryDark: "#6d28d9",
      primarySoft: "#f5f3ff",
      primarySoftBorder: "#ddd6fe",

      accent: "#ec4899",
      accentDark: "#db2777",
      accentSoft: "#fdf2f8",
      accentSoftBorder: "#fbcfe8",

      error: "#ef4444",
      errorSoft: "#fef2f2",
      errorSoftBorder: "#fecaca",

      muted: "#f3f0ff",
      mutedText: "#8b7bb8",
      darkSurface: "#2e1065",
      white: "#ffffff",

      cardGradient: "linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%)",
      cardGlow: "rgba(124, 58, 237, 0.18)",
      cardShadow: "rgba(124, 58, 237, 0.14)",
      cardDecor: "rgba(236, 72, 153, 0.12)",

      seasonOverlay: "transparent",
      seasonParticle: "transparent",
      seasonParticleSoft: "transparent",
    },
  },

  sunset: {
    name: "Sunset",
    season: "none",
    colors: {
      bg: "#fff7ed",
      bgSecondary: "#ffffff",
      text: "#2b1b12",
      textSecondary: "#8b6b5e",
      border: "#fed7aa",

      primary: "#f97316",
      primaryDark: "#ea580c",
      primarySoft: "#fff7ed",
      primarySoftBorder: "#fdba74",

      accent: "#ef4444",
      accentDark: "#dc2626",
      accentSoft: "#fef2f2",
      accentSoftBorder: "#fecaca",

      error: "#dc2626",
      errorSoft: "#fef2f2",
      errorSoftBorder: "#fecaca",

      muted: "#ffedd5",
      mutedText: "#9a7b6f",
      darkSurface: "#431407",
      white: "#ffffff",

      cardGradient: "linear-gradient(180deg, #ffffff 0%, #fff7ed 100%)",
      cardGlow: "rgba(249, 115, 22, 0.2)",
      cardShadow: "rgba(194, 65, 12, 0.16)",
      cardDecor: "rgba(239, 68, 68, 0.12)",

      seasonOverlay: "transparent",
      seasonParticle: "transparent",
      seasonParticleSoft: "transparent",
    },
  },

  spring: {
    name: "Spring",
    season: "spring",
    colors: {
      bg: "#f7fee7",
      bgSecondary: "#ffffff",
      text: "#18320b",
      textSecondary: "#64745c",
      border: "#d9f99d",

      primary: "#65a30d",
      primaryDark: "#4d7c0f",
      primarySoft: "#f7fee7",
      primarySoftBorder: "#bef264",

      accent: "#f472b6",
      accentDark: "#db2777",
      accentSoft: "#fdf2f8",
      accentSoftBorder: "#fbcfe8",

      error: "#ef4444",
      errorSoft: "#fef2f2",
      errorSoftBorder: "#fecaca",

      muted: "#ecfccb",
      mutedText: "#84a16d",
      darkSurface: "#1a2e05",
      white: "#ffffff",

      cardGradient:
        "linear-gradient(180deg, #ffffff 0%, #f7fee7 48%, #ecfccb 100%)",
      cardGlow: "rgba(132, 204, 22, 0.22)",
      cardShadow: "rgba(77, 124, 15, 0.16)",
      cardDecor: "rgba(244, 114, 182, 0.15)",

      seasonOverlay:
        "radial-gradient(circle at 20% 15%, rgba(244, 114, 182, 0.18), transparent 28%), radial-gradient(circle at 85% 25%, rgba(190, 242, 100, 0.22), transparent 30%)",
      seasonParticle: "rgba(244, 114, 182, 0.86)",
      seasonParticleSoft: "rgba(255, 255, 255, 0.88)",
    },
  },

  summer: {
    name: "Summer",
    season: "summer",
    colors: {
      bg: "#fffbeb",
      bgSecondary: "#ffffff",
      text: "#33240a",
      textSecondary: "#7c6a35",
      border: "#fde68a",

      primary: "#eab308",
      primaryDark: "#ca8a04",
      primarySoft: "#fefce8",
      primarySoftBorder: "#fde047",

      accent: "#14b8a6",
      accentDark: "#0f766e",
      accentSoft: "#f0fdfa",
      accentSoftBorder: "#99f6e4",

      error: "#ef4444",
      errorSoft: "#fef2f2",
      errorSoftBorder: "#fecaca",

      muted: "#fef3c7",
      mutedText: "#a16207",
      darkSurface: "#422006",
      white: "#ffffff",

      cardGradient:
        "linear-gradient(180deg, #fff7cc 0%, #fde68a 48%, #facc15 100%)",
      cardGlow: "rgba(250, 204, 21, 0.34)",
      cardShadow: "rgba(202, 138, 4, 0.22)",
      cardDecor: "rgba(20, 184, 166, 0.14)",

      seasonOverlay:
        "radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.42), transparent 22%), radial-gradient(circle at 82% 20%, rgba(251, 191, 36, 0.35), transparent 30%)",
      seasonParticle: "rgba(255, 255, 255, 0.92)",
      seasonParticleSoft: "rgba(254, 240, 138, 0.85)",
    },
  },

  autumn: {
    name: "Autumn",
    season: "autumn",
    colors: {
      bg: "#fff7ed",
      bgSecondary: "#ffffff",
      text: "#2f1b0c",
      textSecondary: "#8b6b5e",
      border: "#fed7aa",

      primary: "#ea580c",
      primaryDark: "#c2410c",
      primarySoft: "#fff7ed",
      primarySoftBorder: "#fdba74",

      accent: "#b45309",
      accentDark: "#92400e",
      accentSoft: "#fffbeb",
      accentSoftBorder: "#fcd34d",

      error: "#dc2626",
      errorSoft: "#fef2f2",
      errorSoftBorder: "#fecaca",

      muted: "#ffedd5",
      mutedText: "#9a3412",
      darkSurface: "#431407",
      white: "#ffffff",

      cardGradient:
        "linear-gradient(180deg, #ffedd5 0%, #fdba74 48%, #ea580c 100%)",
      cardGlow: "rgba(249, 115, 22, 0.26)",
      cardShadow: "rgba(154, 52, 18, 0.22)",
      cardDecor: "rgba(180, 83, 9, 0.18)",

      seasonOverlay:
        "radial-gradient(circle at 20% 15%, rgba(255, 237, 213, 0.32), transparent 24%), radial-gradient(circle at 88% 24%, rgba(180, 83, 9, 0.18), transparent 28%)",
      seasonParticle: "rgba(180, 83, 9, 0.88)",
      seasonParticleSoft: "rgba(253, 186, 116, 0.88)",
    },
  },

  winter: {
    name: "Winter",
    season: "winter",
    colors: {
      bg: "#eef7ff",
      bgSecondary: "#ffffff",
      text: "#0f2638",
      textSecondary: "#5d7284",
      border: "#cdeafe",

      primary: "#0ea5e9",
      primaryDark: "#0284c7",
      primarySoft: "#e0f2fe",
      primarySoftBorder: "#7dd3fc",

      accent: "#38bdf8",
      accentDark: "#0284c7",
      accentSoft: "#f0f9ff",
      accentSoftBorder: "#bae6fd",

      error: "#ef4444",
      errorSoft: "#fef2f2",
      errorSoftBorder: "#fecaca",

      muted: "#dff3ff",
      mutedText: "#6b879b",
      darkSurface: "#082f49",
      white: "#ffffff",

      cardGradient:
        "linear-gradient(180deg, #ffffff 0%, #e0f2fe 42%, #bae6fd 100%)",
      cardGlow: "rgba(14, 165, 233, 0.24)",
      cardShadow: "rgba(2, 132, 199, 0.18)",
      cardDecor: "rgba(255, 255, 255, 0.36)",

      seasonOverlay:
        "radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.74), transparent 22%), radial-gradient(circle at 80% 20%, rgba(186, 230, 253, 0.58), transparent 28%), linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.04))",
      seasonParticle: "rgba(255, 255, 255, 0.98)",
      seasonParticleSoft: "rgba(224, 242, 254, 0.94)",
    },
  },

  aurora: {
    name: "Aurora",
    season: "none",
    colors: {
      bg: "#f5fffd",
      bgSecondary: "#ffffff",
      text: "#112b2b",
      textSecondary: "#5b7a78",
      border: "#c7f9f1",

      primary: "#14b8a6",
      primaryDark: "#0f766e",
      primarySoft: "#ecfeff",
      primarySoftBorder: "#99f6e4",

      accent: "#8b5cf6",
      accentDark: "#6d28d9",
      accentSoft: "#f5f3ff",
      accentSoftBorder: "#ddd6fe",

      error: "#ef4444",
      errorSoft: "#fef2f2",
      errorSoftBorder: "#fecaca",

      muted: "#def7f3",
      mutedText: "#67908d",
      darkSurface: "#0b1f1f",
      white: "#ffffff",

      cardGradient:
        "linear-gradient(180deg, #ffffff 0%, #ecfeff 44%, #f5f3ff 100%)",
      cardGlow: "rgba(20, 184, 166, 0.22)",
      cardShadow: "rgba(17, 43, 43, 0.16)",
      cardDecor: "rgba(139, 92, 246, 0.14)",

      seasonOverlay:
        "radial-gradient(circle at 18% 18%, rgba(45, 212, 191, 0.18), transparent 24%), radial-gradient(circle at 82% 20%, rgba(167, 139, 250, 0.24), transparent 28%), radial-gradient(circle at 50% 100%, rgba(34, 211, 238, 0.18), transparent 36%)",
      seasonParticle: "rgba(45, 212, 191, 0.9)",
      seasonParticleSoft: "rgba(196, 181, 253, 0.9)",
    },
  },
};

export function getCSSVariables(theme: ThemeMode) {
  const t = themes[theme];
  const c = t.colors;

  return `
    --bg: ${c.bg};
    --bg-secondary: ${c.bgSecondary};
    --text: ${c.text};
    --text-secondary: ${c.textSecondary};
    --border: ${c.border};

    --primary: ${c.primary};
    --primary-dark: ${c.primaryDark};
    --primary-soft: ${c.primarySoft};
    --primary-soft-border: ${c.primarySoftBorder};

    --accent: ${c.accent};
    --accent-dark: ${c.accentDark};
    --accent-soft: ${c.accentSoft};
    --accent-soft-border: ${c.accentSoftBorder};

    --error: ${c.error};
    --error-soft: ${c.errorSoft};
    --error-soft-border: ${c.errorSoftBorder};

    --muted: ${c.muted};
    --muted-text: ${c.mutedText};
    --dark-surface: ${c.darkSurface};
    --white: ${c.white};

    --card-gradient: ${c.cardGradient};
    --card-glow: ${c.cardGlow};
    --card-shadow: ${c.cardShadow};
    --card-decor: ${c.cardDecor};

    --season-overlay: ${c.seasonOverlay};
    --season-particle: ${c.seasonParticle};
    --season-particle-soft: ${c.seasonParticleSoft};

    --is-spring: ${t.season === "spring" ? 1 : 0};
    --is-summer: ${t.season === "summer" ? 1 : 0};
    --is-autumn: ${t.season === "autumn" ? 1 : 0};
    --is-winter: ${t.season === "winter" ? 1 : 0};
  `;
}

export function getThemeStyle(theme: ThemeMode): React.CSSProperties {
  return getCSSVariables(theme)
    .split(";")
    .filter(Boolean)
    .reduce((acc, item) => {
      const [key, ...valueParts] = item.split(":");
      const value = valueParts.join(":");

      if (key && value) {
        acc[key.trim() as keyof React.CSSProperties] = value.trim() as never;
      }

      return acc;
    }, {} as React.CSSProperties);
}

export function getSeasonClass(theme: ThemeMode) {
  const season = themes[theme].season;

  return {
    "theme-spring": season === "spring",
    "theme-summer": season === "summer",
    "theme-autumn": season === "autumn",
    "theme-winter": season === "winter",
  };
}
