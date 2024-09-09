/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",  // Ajoutez les chemins vers vos fichiers pour que Tailwind puisse purger les styles inutilisés
  ],
  theme: {
    extend: {},  // Vous pouvez ajouter ici des configurations personnalisées, comme des couleurs, des tailles, etc.
  },
  plugins: [],
};
