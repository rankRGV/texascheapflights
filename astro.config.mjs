// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://texascheapflights.com',
  output: 'server',

  security: {
    checkOrigin: false
  },

  adapter: vercel({
    webAnalytics: {
      enabled: false,
    },
    imagesConfig: {
      sizes: [320, 640, 1280],
    },
  }),

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['resend']
    }
  },

  integrations: []
});