// // lib/themes.ts
// export type ThemeMode = "light" | "dark";

// export const themes = {
//   light: {
//     name: "Light",
//     colors: {
//       bg: "#f5f5f0",
//       bgSecondary: "#ffffff",
//       text: "#1a1a1a",
//       textSecondary: "#6b7280",
//       border: "#e5e7eb",
//       primary: "#16a34a",
//       primaryDark: "#15803d",
//       accent: "#f59e0b",
//       error: "#ef4444",
//     },
//   },
//   dark: {
//     name: "Dark",
//     colors: {
//       bg: "#0f172a",
//       bgSecondary: "#1e293b",
//       text: "#f1f5f9",
//       textSecondary: "#cbd5e1",
//       border: "#334155",
//       primary: "#22c55e",
//       primaryDark: "#16a34a",
//       accent: "#fbbf24",
//       error: "#ff6b6b",
//     },
//   },
// } as const;

// export function getCSSVariables(theme: ThemeMode) {
//   const colors = themes[theme].colors;
//   return `
//     --bg: ${colors.bg};
//     --bg-secondary: ${colors.bgSecondary};
//     --text: ${colors.text};
//     --text-secondary: ${colors.textSecondary};
//     --border: ${colors.border};
//     --primary: ${colors.primary};
//     --primary-dark: ${colors.primaryDark};
//     --accent: ${colors.accent};
//     --error: ${colors.error};
//   `;
// }



// lib/themes.ts
export type ThemeMode = "light" | "dark" | "ocean" | "violet" | "sunset";

type ThemeDef = {
  name: string;
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
  };
};

export const themes: Record<ThemeMode, ThemeDef> = {
  light: {
    name: "Light",
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
    },
  },

  dark: {
    name: "Dark",
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
    },
  },

  ocean: {
    name: "Ocean",
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
    },
  },

  violet: {
    name: "Violet",
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
    },
  },

  sunset: {
    name: "Sunset",
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
    },
  },
};

export function getCSSVariables(theme: ThemeMode) {
  const c = themes[theme].colors;
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
  `;
}