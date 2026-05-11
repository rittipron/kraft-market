import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Bricolage Grotesque', 'system-ui'],
        body: ['var(--font-body)', 'Plus Jakarta Sans', 'system-ui'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        coral: { DEFAULT: '#D97755', soft: '#F5E6DF', deep: '#B85C38' },
        teal: { DEFAULT: '#2A9D8F', soft: '#D4EFED' },
      },
    },
  },
  plugins: [],
};

export default config;
