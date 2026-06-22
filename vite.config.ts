import { readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { artistName, artistDescription } from './src/data/portfolio';

const projectRoot = dirname(fileURLToPath(import.meta.url));

type ImageSize = { width: number; height: number };

/** Read width/height from a JPEG file header (no dependencies). */
function getJpegSize(buf: Buffer): ImageSize | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 8 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    // Start-of-Frame markers (0xC0–0xCF) except DHT (C4), JPG ext (C8), DAC (CC).
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    const segLen = buf.readUInt16BE(i + 2);
    i += 2 + segLen;
  }
  return null;
}

/** Read width/height from a PNG file header. */
function getPngSize(buf: Buffer): ImageSize | null {
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/**
 * Exposes a virtual module `virtual:artwork-dimensions` that maps each
 * image path under `public/artworks/` to its `"width / height"` ratio.
 */
function artworkDimensionsPlugin(): Plugin {
  const virtualId = 'virtual:artwork-dimensions';
  const resolvedVirtualId = '\0' + virtualId;
  const artworksDir = join(projectRoot, 'public', 'artworks');

  function collect(): Record<string, string> {
    const dims: Record<string, string> = {};
    let entries: string[];
    try {
      entries = readdirSync(artworksDir);
    } catch {
      return dims;
    }
    for (const file of entries) {
      const ext = extname(file).toLowerCase();
      let size: ImageSize | null = null;
      const buf = readFileSync(join(artworksDir, file));
      if (ext === '.jpg' || ext === '.jpeg') size = getJpegSize(buf);
      else if (ext === '.png') size = getPngSize(buf);
      if (size && size.width > 0 && size.height > 0) {
        dims[`artworks/${file}`] = `${size.width} / ${size.height}`;
      }
    }
    return dims;
  }

  return {
    name: 'artwork-dimensions',
    resolveId(id) {
      if (id === virtualId) return resolvedVirtualId;
      return null;
    },
    load(id) {
      if (id !== resolvedVirtualId) return null;
      return `export default ${JSON.stringify(collect(), null, 2)};`;
    },
    configureServer(server) {
      const invalidate = (file: string) => {
        if (!file.startsWith(artworksDir)) return;
        const mod = server.moduleGraph.getModuleById(resolvedVirtualId);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.add(artworksDir);
      server.watcher.on('add', invalidate);
      server.watcher.on('change', invalidate);
      server.watcher.on('unlink', invalidate);
    },
  };
}

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
    artworkDimensionsPlugin(),
  ],
});