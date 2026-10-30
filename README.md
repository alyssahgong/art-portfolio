# Art Portfolio

High school senior art portfolio site for Alyssa Gong. The project is built with Vite, React, and TypeScript.

Before publishing major updates, verify the artist statement, artwork images, artwork metadata, awards, and public contact information.

## Local Development

Install dependencies:

```bash
npm install
```

Start the local site:

```bash
npm run dev
```

Build the production version:

```bash
npm run build
```

## Edit Content

- Artist profile, contact links, hero artwork, and portfolio focus notes live in `src/data/portfolio.ts`.
- Artworks live in `artwork-originals/`: one original image per piece, **named exactly after its title** (e.g. `Two Worlds.jpeg`), plus `artworks.json` with each piece's details. A leading number sets the order on the page and isn't part of the title: `03 Two Worlds.jpeg` is "Two Worlds", shown third (gaps are fine). Unnumbered pieces come after, in `artworks.json` order. Only `title` is required; any other field that's missing is hidden. Award competitions are listed once under `competitions` and referenced by key.
- To show several views of one piece (other angles, details), use a **folder named after the title** instead of a single image, e.g. `The Thread of Life/1 Full view.jpeg`, `The Thread of Life/2 Detail.jpeg`. Views are ordered by file name and the first is the cover in the grid. Text after the leading number becomes the view's caption in the lightbox ("Full view", "Detail"); a file named just `2.jpeg` has no caption. `artworks.json` doesn't change.
- The hero image at the top of the page is the one image in `artwork-originals/_hero/` (currently Alyssums), which isn't shown in the portfolio grid. If that folder is empty, the hero uses the piece named by `heroArtwork` in `src/data/portfolio.ts`, or else the piece marked `"featured": true`.
- Images can be JPEG, PNG, TIFF, or WebP (export iPhone HEIC files as JPEG first).
- The dev server and build validate `artworks.json` — a title with no matching image, wrong upper/lower case, or an unknown award level or competition stops with a message saying what to fix — and generate `src/data/artworks.generated.ts`. Don't edit the generated file; commit it along with your changes.
- The build also generates web sizes from each original: an 800px-wide WebP thumbnail for the grid and a JPEG capped at 2400px for the lightbox and hero. Originals are never published, and the generated images have photo metadata (including GPS location) stripped. Sizes are set at the top of `plugins/artworks.ts`.
- The GitHub Pages base path is configured in `vite.config.ts` as `/art-portfolio/`.

## Deploy

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` for publishing to GitHub Pages.

Before the first publish, open the repository settings and choose:

```text
Settings > Pages > Build and deployment > Source > GitHub Actions
```

Then run the `Deploy to GitHub Pages` workflow from the Actions tab.

The site will publish at:

```text
https://alyssahgong.github.io/art-portfolio/
```