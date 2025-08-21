import { fontFamily } from "tailwindcss/defaultTheme"
import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

export default {
  darkMode: ["class"],
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "slow-pulse": {
          "0%, 100%": {
            backgroundColor: "hsl(var(--background))", // Базовый фон
          },
          "50%": {
            backgroundColor: "var(--yellow-100, #fefcbf)", // Бледно-жёлтый
            opacity: "0.8"
          },
        },
        "green-pulse": {
          "0%, 100%": {
            backgroundColor: "hsl(var(--background))", // Базовый фон
            borderColor: "hsl(var(--border))", // Базовая обводка
            opacity: "1"
          },
          "50%": {
            backgroundColor: "var(--green-100, #d1fae5)", // Бледно-зелёный
            borderColor: "#22c55e", // Ярко-зелёный (green-500)
            opacity: "0.6"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slow-pulse": "slow-pulse 3s ease-in-out infinite", // Жёлтый пульс, 3 секунды
        "green-pulse": "green-pulse 1.5s ease-in-out 1", // Зелёный пульс, 1 цикл
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config