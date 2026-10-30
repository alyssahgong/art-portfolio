// Artwork records live in `artwork-originals/artworks.json`; the build validates them and generates
// `artworks.generated.ts` (imported as `artworks`). The types below describe the generated records.

export type Award = {
  /** Short label shown on the award chip in the lightbox and Awards and Honors section (e.g. "Gold Key", "2nd Place"). */
  label: string;
  /** Visual tier. To add a new tier, extend this union, the list in vite.config.ts, and add a matching `.award-chip-<level>` rule in App.css. */
  level: 'gold' | 'silver' | 'honorable';
  /** Full competition name (resolved from the competition key in artworks.json). */
  competition?: string;
  /** For a multi-view piece, index into `images` of the view that earned the award (from `award.view` in artworks.json). */
  view?: number;
};

/** Web-sized copies generated from the original image. Paths are relative to the site base. */
export type ArtworkImage = {
  /** `"width / height"` CSS aspect-ratio string. */
  ratio: string;
  /** Grid thumbnail. */
  thumb: string;
  /** Lightbox and hero image. */
  large: string;
  /** Full-size view: the original's resolution, metadata stripped. */
  full: string;
  /** Pixel size of `full` (the original, after EXIF rotation). */
  width: number;
  height: number;
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
  /**
   * Title of the artwork whose image fills the hero. Only used when `artwork-originals/_hero/` has no image —
   * the hero is currently Alyssums from there, which isn't one of the portfolio pieces.
   */
  heroArtwork: '',
  /** Artist statement, shown in the Artist Statement section — one string per paragraph. */
  statement: [
  'Studying art history helped me realize how my relationship with art has developed alongside not only the history I have learned but also my own personal history.',
  'As a child, I filled pages with scribbles without thinking about their meaning or quality—I simply enjoyed creating. Over time, however, I became more conscious of technique. I learned that making art was not only about having unique ideas, but also about translating those creative impulses into physical forms. I wanted to become a human printer, shifting my approach to art from casual practice into an obsession with perfection.',
  'I began experimenting with materials and studying other artists, becoming more intentional about composition, color, texture, and form. Thankfully, this knowledge led to more artistic freedom, as I grew comfortable with artistic liberties rather than mastery. Once I realized that art was not about perfect photorealism, I allowed more of my personal voice to seep into my work. Family history, childhood memories, and personal growth became artistic inspiration. Including myself in my art allowed me to communicate thoughts I previously struggled to express, helping me to better understand how my past has shaped my values.',
  'The knowledge gained from art history helped me understand that art does not exist in isolation. It connects people, communities, and experiences that might otherwise remain separate. I experienced this while volunteering as a sketching facilitator in galleries at the Harvard Museum of Natural History. Similarly, working with the Special Needs Arts Program showed me how art can foster new forms of communication, creating space for people with different abilities to participate together. Art became less about what I could create alone and more about what happens when people create alongside one another.',
  'Eventually, I began seeing art as a form of activism. Learning about artists who use their work to respond to social and political issues showed me how art can question the world we inhabit. After researching art’s influence on the Asian American Movement of the late 1960s, for example, I wanted to incorporate activism into my own work. At the Pao Arts Center, I collaborated on a mural with a group of other youth artists, seeking to design a piece honoring both the history of Boston’s Chinatown and the ethnic melting pot that it is today. I hope to explore art activism further, using artwork to preserve histories and challenge assumptions.',
  ],
  /** One-sentence summary of the concentration, shown in the hero under the artist's name. */
  concentration:
    'Exploring Asian American identity and cultural belonging through bamboo, yarn, paper, and print, layering family history and personal memory to ask how identity is shaped, challenged, and redefined.',
  /** Optional context for the Awards and Honors section — anything left empty is hidden. */
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
