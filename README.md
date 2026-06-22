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

- Artist profile, contact links, hero image, artwork metadata, and portfolio focus notes live in `src/data/portfolio.ts`.
- Artwork files live in `public/artworks/`.
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