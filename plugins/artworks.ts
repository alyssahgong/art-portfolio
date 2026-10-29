import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, extname, join, relative, sep } from 'node:path';
import sharp from 'sharp';
import type { Plugin } from 'vite';

/** Width (px) of the grid thumbnails — about 1.7x the widest grid card (~370px): close to Retina-sharp at a smaller download. */
const THUMB_WIDTH = 640;
/** Longest edge (px) of the lightbox and hero image. */
const LARGE_MAX_EDGE = 2400;
const THUMB_WEBP_QUALITY = 80;
const LARGE_JPEG_QUALITY = 85;
/**
 * The full-size view is the original JPEG itself, byte for byte, with only its metadata (EXIF incl. GPS location, XMP,
 * IPTC, comments) cut out — see stripJpegMetadata(). Only originals that can't be copied as-is (not JPEG, or needing
 * EXIF rotation) are re-encoded, at this quality.
 */
const FULL_JPEG_QUALITY = 95;
/** Changing a setting above must regenerate cached images, so they're part of the cache key. */
const OUTPUT_SETTINGS = `thumb ${THUMB_WIDTH}w webp q${THUMB_WEBP_QUALITY}, large ${LARGE_MAX_EDGE} jpeg q${LARGE_JPEG_QUALITY}, full exact copy or jpeg q${FULL_JPEG_QUALITY}`;
const ORIGINAL_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp']);
/** Keep in sync with `Award['level']` in src/data/portfolio.ts. */
const AWARD_LEVELS = ['gold', 'silver', 'honorable'];
const TEXT_FIELDS = ['year', 'medium', 'dimensions', 'alt', 'description'] as const;
const KNOWN_FIELDS = new Set(['title', ...TEXT_FIELDS, 'categories', 'award', 'featured']);

type ArtworkImage = { ratio: string; thumb: string; large: string; full: string; width: number; height: number; caption?: string };
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

/**
 * Copies a JPEG with its metadata removed but the image data untouched (no re-encoding, so no quality loss).
 * Keeps only the segments needed to show the image as it was: JFIF (APP0), the ICC color profile (APP2) and Adobe color
 * info (APP14), plus the tables and scans. Drops EXIF and XMP (APP1), IPTC (APP13), comments, every other APPn block,
 * and anything after the main image (e.g. phone depth maps / gain maps, which can carry their own EXIF).
 * Returns null if the file isn't a JPEG this can parse, so the caller can fall back to re-encoding.
 */
function stripJpegMetadata(input: Buffer): Buffer | null {
  if (input[0] !== 0xff || input[1] !== 0xd8) return null;
  const kept: Buffer[] = [input.subarray(0, 2)];
  let pos = 2;
  while (pos + 4 <= input.length) {
    if (input[pos] !== 0xff) return null;
    const marker = input[pos + 1];
    if (marker === 0xff) {
      pos += 1; // Fill byte.
      continue;
    }
    const length = input.readUInt16BE(pos + 2);
    const end = pos + 2 + length;
    if (end > input.length) return null;
    const segment = input.subarray(pos, end);

    if (marker === 0xda) {
      // Start of scan: from here on it's image data (and, for progressive JPEGs, more tables and scans) up to the end
      // marker. Inside the entropy-coded data 0xFF is always followed by 0x00 or a restart marker, so the first
      // 0xFF 0xD9 is the real end of the main image.
      const eoi = input.indexOf(Buffer.from([0xff, 0xd9]), end);
      if (eoi === -1) return null;
      kept.push(input.subarray(pos, eoi + 2));
      return Buffer.concat(kept);
    }

    const isApp = marker >= 0xe0 && marker <= 0xef;
    const keep =
      (!isApp && marker !== 0xfe) ||
      marker === 0xe0 ||
      marker === 0xee ||
      (marker === 0xe2 && segment.subarray(4, 16).toString('latin1') === 'ICC_PROFILE\0');
    if (keep) kept.push(segment);
    pos = end;
  }
  return null;
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
 *   - generates web sizes of each image (`thumb` WebP for the grid, `large` JPEG for the lightbox and hero,
 *     `full` for the full-size view: the original JPEG unchanged), with EXIF orientation applied and all metadata
 *     (including GPS location) stripped
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

      // Optional `award.view`: the file name (without extension) of the view in the piece's folder that earned it.
      let awardView: string | undefined;
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
          if (award.view !== undefined) {
            if (typeof award.view === 'string' && award.view.trim()) awardView = award.view.normalize('NFC');
            else fail('"award.view" must be the file name of one view, e.g. "1 Fruits".');
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
        const { images } = matches[0];
        if (awardView !== undefined && record.award) {
          const viewIndex = images.findIndex((file) => images.length > 1 && fileTitle(file) === awardView);
          if (viewIndex === -1) {
            fail(
              images.length > 1
                ? `"award.view" "${awardView}" isn't one of: ${images.map(fileTitle).join(', ')}.`
                : '"award.view" only applies to a piece with several views (a folder).',
            );
          } else {
            (record.award as Record<string, unknown>).view = viewIndex;
          }
        }
        records.push({ record, images });
      }
    });

    warnGitCaseMismatches(warn);

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
  /**
   * macOS file names ignore upper/lower case, so git there doesn't notice a case-only rename (e.g. "alyssums.jpeg" →
   * "Alyssums.jpeg") and keeps committing the old name. The Linux build on GitHub is case-sensitive and then can't find
   * the image. Compare git's tracked names with the real ones on disk and say how to fix any that differ.
   */
  function warnGitCaseMismatches(warn: (message: string) => void) {
    let tracked: string[];
    try {
      tracked = execFileSync('git', ['ls-files', '-z', '--', 'artwork-originals'], { cwd: projectRoot, encoding: 'utf8' })
        .split('\0')
        .filter(Boolean);
    } catch {
      return; // Not a git checkout, or git isn't installed.
    }

    const namesInDir = new Map<string, string[]>();
    const actualName = (dir: string, name: string) => {
      if (!namesInDir.has(dir)) namesInDir.set(dir, existsSync(join(projectRoot, dir)) ? readdirSync(join(projectRoot, dir)) : []);
      return namesInDir.get(dir)!.find((entry) => entry.toLowerCase() === name.toLowerCase());
    };

    for (const path of tracked) {
      const parts = path.split('/');
      const actualParts = parts.map((part, index) => actualName(parts.slice(0, index).join('/'), part) ?? part);
      const actualPath = actualParts.join('/');
      if (actualPath !== path) {
        warn(
          `git has "${path}" but the file is named "${actualPath}" — the GitHub build will fail to find it. ` +
            `Fix with: git mv -f "${path}" "${actualPath}"`,
        );
      }
    }
  }

  async function processImage(name: string, file: string): Promise<ArtworkImage> {
    const source = join(originalsDir, file);
    const thumb = `artworks/thumb/${name}.webp`;
    const large = `artworks/large/${name}.jpg`;
    const full = `artworks/full/${name}.jpg`;
    const metaPath = join(cacheDir, `${name}.json`);
    const sourceModified = statSync(source).mtimeMs;

    try {
      const cached = JSON.parse(readFileSync(metaPath, 'utf8'));
      if (
        cached.file === file &&
        cached.settings === OUTPUT_SETTINGS &&
        cached.sourceModified === sourceModified &&
        existsSync(join(cacheDir, thumb)) &&
        existsSync(join(cacheDir, large)) &&
        existsSync(join(cacheDir, full))
      ) {
        return cached.image;
      }
    } catch {
      // No usable cache entry; regenerate below.
    }

    mkdirSync(join(cacheDir, 'artworks', 'thumb'), { recursive: true });
    mkdirSync(join(cacheDir, 'artworks', 'large'), { recursive: true });
    mkdirSync(join(cacheDir, 'artworks', 'full'), { recursive: true });

    // rotate() with no arguments applies the EXIF orientation; sharp drops all metadata from outputs by default.
    const input = sharp(source).rotate();
    const largeInfo = await input
      .clone()
      .resize({ width: LARGE_MAX_EDGE, height: LARGE_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: LARGE_JPEG_QUALITY, mozjpeg: true })
      .toFile(join(cacheDir, large));
    await input
      .clone()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMB_WEBP_QUALITY })
      .toFile(join(cacheDir, thumb));

    // The original as-is, unless it's not a JPEG or must be rotated: a copy with no EXIF would lose its orientation tag.
    const metadata = await sharp(source).metadata();
    const exactCopy = (metadata.orientation ?? 1) === 1 ? stripJpegMetadata(readFileSync(source)) : null;
    let fullSize = { width: metadata.width, height: metadata.height };
    if (exactCopy) {
      writeFileSync(join(cacheDir, full), exactCopy);
    } else {
      fullSize = await input
        .clone()
        .jpeg({ quality: FULL_JPEG_QUALITY, mozjpeg: true })
        .toFile(join(cacheDir, full));
    }

    const image = {
      ratio: `${largeInfo.width} / ${largeInfo.height}`,
      thumb,
      large,
      full,
      width: fullSize.width,
      height: fullSize.height,
    };
    writeFileSync(metaPath, JSON.stringify({ file, sourceModified, settings: OUTPUT_SETTINGS, image }));
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
        for (const fileName of [image.thumb, image.large, image.full]) {
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
