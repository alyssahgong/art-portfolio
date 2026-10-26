// Artwork records live in `artwork-originals/artworks.json`; the build validates them and generates
// `artworks.generated.ts` (imported as `artworks`). The types below describe the generated records.

export type Award = {
  /** Short label shown on the award chip in the lightbox and Recognition section (e.g. "Gold Key", "2nd Place"). */
  label: string;
  /** Visual tier. To add a new tier, extend this union, the list in vite.config.ts, and add a matching `.award-chip-<level>` rule in App.css. */
  level: 'gold' | 'silver' | 'honorable';
  /** Full competition name (resolved from the competition key in artworks.json). */
  competition?: string;
};

/** Web-sized copies generated from the original image. Paths are relative to the site base. */
export type ArtworkImage = {
  /** `"width / height"` CSS aspect-ratio string. */
  ratio: string;
  /** Grid thumbnail. */
  thumb: string;
  /** Lightbox, full-screen, and hero image. */
  large: string;
  /** For a multi-view piece, from the view's file name (e.g. "2 Side.jpg" → "Side"). */
  caption?: string;
};

export type Artwork = {
  /** Generated from the title (e.g. "is-it-all-a-fabrication"); used for page anchors and web image names. */
  id: string;
  /** Also the name of the original image (without extension), or of the folder holding several views, in `artwork-originals/`. */
  title: string;
  /** Optional details — any that are missing or empty are hidden in the lightbox. */
  year?: string;
  medium?: string;
  dimensions?: string;
  categories: string[];
  /** One or more views; the first is the cover shown in the grid and hero. */
  images: ArtworkImage[];
  /** Falls back to the title when not given in artworks.json. */
  alt: string;
  /** Optional artist note shown in the lightbox below the award. */
  description?: string;
  /** Optional award, recognition, or honor. */
  award?: Award;
  /** Marks the fallback hero artwork when `artist.heroArtwork` isn't set. */
  featured?: boolean;
};

export type NarrativeBlock = {
  title: string;
  description: string;
};

export const artistName = 'Alyssa Gong';
export const artistDescription = 'Selected works by Alyssa Gong across drawing, printmaking, painting, mixed media, sculpture, and installation.';

export const artist = {
  name: artistName,
  location: '',
  instagram: '',
  /** Title of the artwork whose image fills the hero. */
  heroArtwork: 'Alyssums',
  statement:
    'Recent award-recognized work spans printmaking, mixed media, drawing, painting, and installation, reflecting an ongoing investigation into transformation and the ways cultural traditions are preserved and reimagined through contemporary practice.',
  bio:
    `${artistName} is a high school senior artist working across drawing, printmaking, painting, mixed media, sculpture, and installation. Her practice explores Asian identity, cultural memory, and belonging, using layered surfaces, constructed forms, and material experimentation to trace the relationship between personal narrative and broader cultural experience.`,
  /** Concentration statement, shown in the hero under the artist's name. */
  concentration:
    'The portfolio explores Asian American identity and the complexities of cultural belonging through a combination of finished works and process-driven investigations. Using materials such as bamboo, yarn, paper, print surfaces, and reflective elements, the work examines themes of migration, cultural memory, family heritage, and the negotiation between tradition and contemporary life. By layering personal narratives with broader social and cultural histories, the portfolio reflects on how identity is continuously shaped, challenged, and redefined.',
  /** Optional context for the Recognition section — anything left empty is hidden. */
  school: '',
  graduationYear: '',
  courses: [] as string[],
  programs: [] as string[],
};

export const processHighlights: NarrativeBlock[] = [
  {
    title: 'Layered Studies',
    description:
      'Drawings and print surfaces build repeated forms, edges, and textures before they expand into larger mixed media works.',
  },
  {
    title: 'Material Experiments',
    description:
      'Yarn, bamboo, paper, mirror, gold leaf, fabric, ink, and paint are treated as active parts of the meaning, not just surface choices.',
  },
  {
    title: 'Scale and Installation',
    description:
      'Several works move beyond the flat image into relief, sculpture, and installation, turning personal themes into spaces viewers can enter or move around.',
  },
];
