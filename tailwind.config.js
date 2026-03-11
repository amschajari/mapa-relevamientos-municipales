/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        estado: {
          pendiente: '#9ca3af',
          'pendiente-bg': '#f3f4f6',
          progreso: '#f59e0b',
          'progreso-bg': '#fef3c7',
          completado: '#10b981',
          'completado-bg': '#d1fae5',
          pausado: '#ef4444',
          'pausado-bg': '#fee2e2',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
