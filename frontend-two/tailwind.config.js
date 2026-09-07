/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        govBlue: "#1d70b8",
        govYellow: "#ffdd00",
        backgroundGrey: "#f3f2f1",
        focusText: "#0b0c0c",
        hoverBlue: "#003078",
        govGreen: "#00703c",
        govRed: "#d4351c",
      },
    },
  },
  plugins: [],
};
