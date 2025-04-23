import { appColors } from "./src/global-theme.js";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      color: {
        background: appColors.background,
        contrast: appColors.contrast,
        primary: appColors.primary,
        secondary: appColors.secondary,
        alternative: appColors.alternative,
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Merriweather", "ui-serif", "Georgia", "serif"],
        mono: ["Fira Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
