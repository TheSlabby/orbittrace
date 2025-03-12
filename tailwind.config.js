// tailwind.config.js
const {heroui} = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}", // Include your app files
    "./node_modules/@heroui/**/*.{js,ts,jsx,tsx}", // Include all HeroUI components    
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
    
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [heroui()],
};