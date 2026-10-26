import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, relative, sep } from 'node:path';
import sharp from 'sharp';
import type { Plugin } from 'vite';

/** Width (px) of the grid thumbnails — about 2x the widest grid card, so they stay sharp on Retina screens. */
const THUMB_WIDTH = 800;
/** Longest edge (px) of the lightbox / full-screen image. Originals are never published at full resolution. */
const LARGE_MAX_EDGE = 2400;
const ORIGINAL_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp']);
/** Keep in sync with `Award['level']` in src/data/portfolio.ts. */
const AWARD_LEVELS = ['gold', 'silver', 'honorable'];
const TEXT_FIELDS = ['year', 'medium', 'dimensions', 'alt', 'description'] as const;
const KNOWN_FIELDS = new Set(['title', ...TEXT_FIELDS, 'categories', 'award', 'featured']);

type ArtworkImage = { ratio: string; thumb: string; large: string; caption?: string };
type ArtworkRecord = Record<string, unknown> & { id: string };

function isOriginalImage(file: string) {
  return !file.startsWith('.') && ORIGINAL_EXTENSIONS.has(extname(file).toLowerCase());
}

/** Caption from a view's file name inside a piece's folder: "2 Side detail.jpg" → "Side detail"; "2.jpg" → none. */
function viewCaption(file: string) {
  return fileTitle(file).replace(/^\d+[\s._-]*/, '').trim() || undefined;
}

/** File name without its extension, in NFC form (macOS stores accented file names decomposed). */
function fileTitle(file: string) {
  return basename(file, extname(file)).normalize('NFC');
}

/** URL-safe id from a title, e.g. "Is It All a Fabrication?" → "is-it-all-a-fabrication". */
function slugify(title: string) {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Builds the artwork data from `artwork-originals/`:
 *   - validates `artworks.json` and matches each entry to the image whose file name is its `title`;
 *     each artwork's `id` (used for page anchors and web image names) is derived from the title
 *   - generates web sizes of each image (`thumb` WebP for the grid, `large` JPEG for the lightbox and hero),
 *     with EXIF orientation applied and all metadata (including GPS location) stripped
 *   - writes `src/data/artworks.generated.ts` with the records and their image info
 * Runs at dev-server start and on every build, and again in dev whenever anything in `artwork-originals/` changes.
 * Generated images are cached in `node_modules/.cache/artwork-images/` and only regenerated when an original changes.
 */
export function artworksPlugin(projectRoot: string): Plugin {
  const originalsDir = join(projectRoot, 'artwork-originals');
  const dataFile = join(originalsDir, 'artworks.json');
  const generatedFile = join(projectRoot, 'src', 'data', 'artworks.generated.ts');
  const cacheDir = join(projectRoot, 'node_modules', '.cache', 'artwork-images');
  let images: ArtworkImage[] = [];
  let running: Promise<void> = Promise.resolve();

  function readArtworks(warn: (message: string) => void) {
    const errors: string[] = [];
    let data: { competitions?: unknown; artworks?: unknown };
    try {
      data = JSON.parse(readFileSync(dataFile, 'utf8'));
    } catch (error) {
      throw new Error(`artworks.json: ${(error as Error).message}`);
    }

    const competitions = (data.competitions ?? {}) as Record<string, unknown>;
    if (!Array.isArray(data.artworks)) {
      throw new Error('artworks.json: "artworks" must be a list.');
    }

    // A piece is either one image named after its title, or a folder named after its title holding
    // several views (sorted by file name; the first is the cover).
    const sources: { title: string; name: string; images: string[] }[] = [];
    for (const entry of readdirSync(originalsDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) {
        const images = readdirSync(join(originalsDir, entry.name))
          .filter(isOriginalImage)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map((file) => `${entry.name}/${file}`);
        sources.push({ title: entry.name.normalize('NFC'), name: `${entry.name}/`, images });
      } else if (isOriginalImage(entry.name)) {
        sources.push({ title: fileTitle(entry.name), name: entry.name, images: [entry.name] });
      }
    }
    const sourcesByTitle = new Map<string, typeof sources>();
    for (const source of sources) {
      sourcesByTitle.set(source.title, [...(sourcesByTitle.get(source.title) ?? []), source]);
    }

    const seenTitles = new Set<string>();
    const titlesById = new Map<string, string>();
    const records: { record: ArtworkRecord; images: string[] }[] = [];

    data.artworks.forEach((entry: Record<string, unknown>, index: number) => {
      const where = `artworks[${index}]${typeof entry?.title === 'string' ? ` ("${entry.title}")` : ''}`;
      const fail = (message: string) => errors.push(`${where}: ${message}`);

      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
        fail('must be an object.');
        return;
      }
      if (typeof entry.title !== 'string' || !entry.title.trim()) {
        fail('"title" is required.');
        return;
      }
      const title = entry.title.normalize('NFC');
      if (seenTitles.has(title)) fail('duplicate title.');
      seenTitles.add(title);

      const id = slugify(title);
      const sameId = titlesById.get(id);
      if (!id) fail('title needs at least one letter or number.');
      else if (sameId && sameId !== title) fail(`title is too similar to "${sameId}" (both become "${id}").`);
      titlesById.set(id, title);

      const record: ArtworkRecord = { id, title };
      for (const field of TEXT_FIELDS) {
        const value = entry[field];
        if (value === undefined || value === '') continue;
        if (typeof value === 'string' || typeof value === 'number') record[field] = String(value);
        else fail(`"${field}" must be text.`);
      }
      record.alt ??= title;

      if (entry.categories !== undefined && !(Array.isArray(entry.categories) && entry.categories.every((c) => typeof c === 'string'))) {
        fail('"categories" must be a list of text.');
      }
      record.categories = Array.isArray(entry.categories) ? entry.categories : [];

      if (entry.award !== undefined) {
        const award = entry.award as Record<string, unknown>;
        if (typeof award !== 'object' || award === null) {
          fail('"award" must be an object.');
        } else {
          if (typeof award.label !== 'string' || !award.label) fail('"award.label" is required.');
          if (!AWARD_LEVELS.includes(award.level as string)) {
            fail(`"award.level" must be one of: ${AWARD_LEVELS.join(', ')}.`);
          }
          let competition: string | undefined;
          if (award.competition !== undefined) {
            const name = competitions[award.competition as string];
            if (typeof name === 'string') competition = name;
            else fail(`unknown competition "${award.competition}" — add it to "competitions" at the top of artworks.json.`);
          }
          record.award = { label: award.label, level: award.level, ...(competition && { competition }) };
        }
      }

      if (entry.featured !== undefined) {
        if (typeof entry.featured === 'boolean') record.featured = entry.featured;
        else fail('"featured" must be true or false.');
      }

      for (const field of Object.keys(entry)) {
        if (!KNOWN_FIELDS.has(field)) warn(`${where}: unknown field "${field}" is ignored.`);
      }

      const matches = sourcesByTitle.get(title) ?? [];
      if (matches.length > 1) {
        fail(`more than one image or folder named "${title}": ${matches.map((match) => match.name).join(', ')}.`);
      } else if (matches.length === 0) {
        const wrongCase = sources.find((source) => source.title.toLowerCase() === title.toLowerCase());
        fail(
          wrongCase
            ? `"${wrongCase.name}" doesn't match the title's upper/lower case — rename it or fix the title so they match exactly.`
            : `no image (.jpg, .jpeg, .png, .tif, .tiff, or .webp) or folder named "${title}" in artwork-originals/.`,
        );
      } else if (matches[0].images.length === 0) {
        fail(`folder "${matches[0].name}" has no images.`);
      } else {
        records.push({ record, images: matches[0].images });
      }
    });

    for (const [title, titleSources] of sourcesByTitle) {
      if (!seenTitles.has(title)) {
        warn(`artwork-originals/${titleSources.map((source) => source.name).join(', ')} has no entry in artworks.json and is not shown.`);
      }
    }

    if (errors.length) {
      throw new Error(`artworks.json has ${errors.length} problem(s):\n  - ${errors.join('\n  - ')}`);
    }
    return records;
  }

  /** `name` is the web file name (without extension) for this image: the artwork id, plus `-<n>` for multi-view pieces. */
  async function processImage(name: string, file: string): Promise<ArtworkImage> {
    const source = join(originalsDir, file);
    const thumb = `artworks/thumb/${name}.webp`;
    const large = `artworks/large/${name}.jpg`;
    const metaPath = join(cacheDir, `${name}.json`);
    const sourceModified = statSync(source).mtimeMs;

    try {
      const cached = JSON.parse(readFileSync(metaPath, 'utf8'));
      if (
        cached.file === file &&
        cached.sourceModified === sourceModified &&
        existsSync(join(cacheDir, thumb)) &&
        existsSync(join(cacheDir, large))
      ) {
        return cached.image;
      }
    } catch {
      // No usable cache entry; regenerate below.
    }

    mkdirSync(join(cacheDir, 'artworks', 'thumb'), { recursive: true });
    mkdirSync(join(cacheDir, 'artworks', 'large'), { recursive: true });

    // rotate() with no arguments applies the EXIF orientation; sharp drops all metadata from outputs by default.
    const input = sharp(source).rotate();
    const largeInfo = await input
      .clone()
      .resize({ width: LARGE_MAX_EDGE, height: LARGE_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile(join(cacheDir, large));
    await input
      .clone()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(join(cacheDir, thumb));

    const image = { ratio: `${largeInfo.width} / ${largeInfo.height}`, thumb, large };
    writeFileSync(metaPath, JSON.stringify({ file, sourceModified, image }));
    return image;
  }

  async function generate(warn: (message: string) => void) {
    const records = readArtworks(warn);
    const artworks = await Promise.all(
      records.map(async ({ record, images: files }) => {
        const isFolder = files.length > 1 || files[0].includes('/');
        const artworkImages = await Promise.all(
          files.map(async (file, index) => {
            const image = await processImage(isFolder ? `${record.id}-${index + 1}` : record.id, file);
            const caption = isFolder ? viewCaption(file) : undefined;
            return caption ? { ...image, caption } : image;
          }),
        );
        return { ...record, images: artworkImages };
      }),
    );

    const source = [
      '// Generated from artwork-originals/artworks.json by plugins/artworks.ts — do not edit by hand.',
      '// Edit artworks.json or the images next to it; this file is rewritten on every dev-server start and build.',
      "import type { Artwork } from './portfolio';",
      '',
      `export const artworks: Artwork[] = ${JSON.stringify(artworks, null, 2)};`,
      '',
    ].join('\n');
    if (!existsSync(generatedFile) || readFileSync(generatedFile, 'utf8') !== source) {
      writeFileSync(generatedFile, source);
    }
    images = artworks.flatMap((artwork) => artwork.images);
  }

  /** Runs generate() one at a time, so overlapping file-change events don't write concurrently. */
  function regenerate(warn: (message: string) => void) {
    running = running.catch(() => {}).then(() => generate(warn));
    return running;
  }

  return {
    name: 'artworks',
    async buildStart() {
      await regenerate((message) => this.warn(message));
    },
    generateBundle() {
      for (const image of images) {
        for (const fileName of [image.thumb, image.large]) {
          this.emitFile({ type: 'asset', fileName, source: readFileSync(join(cacheDir, fileName)) });
        }
      }
    },
    configureServer(server) {
      const { base, logger } = server.config;

      // Serve generated images in dev from the cache directory.
      server.middlewares.use(async (req, res, next) => {
        const path = decodeURIComponent((req.url ?? '').split('?')[0]);
        const relativePath = path.startsWith(base) ? path.slice(base.length) : path.replace(/^\//, '');
        if (!relativePath.startsWith('artworks/')) return next();

        await running.catch(() => {});
        const file = join(cacheDir, relativePath);
        if (!file.startsWith(cacheDir + sep) || !existsSync(file)) return next();

        res.setHeader('Content-Type', file.endsWith('.webp') ? 'image/webp' : 'image/jpeg');
        createReadStream(file).pipe(res);
      });

      const onChange = async (file: string) => {
        if (!file.startsWith(originalsDir + sep)) return;
        try {
          await regenerate((message) => logger.warn(message));
          logger.info(`artworks: regenerated after change to ${relative(projectRoot, file)}`);
          server.ws.send({ type: 'full-reload' });
        } catch (error) {
          const { message } = error as Error;
          logger.error(message);
          server.ws.send({ type: 'error', err: { message, stack: '' } });
        }
      };
      server.watcher.add(originalsDir);
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
