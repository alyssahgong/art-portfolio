import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { artworksPlugin } from './plugins/artworks';
import { artistName, artistDescription } from './src/data/portfolio';

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: '/art-portfolio/',
  plugins: [
    react(),
    {
      name: 'html-artist-name',
      transformIndexHtml(html) {
        return html
          .replaceAll('%ARTIST_NAME%', artistName)
          .replaceAll('%DESCRIPTION%', artistDescription);
      },
    },
    artworksPlugin(projectRoot),
  ],
});