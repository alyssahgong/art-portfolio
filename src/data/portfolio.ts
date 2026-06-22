export type Award = {
  /** Short label shown on the work-card chip (e.g. "Gold Key", "2nd Place"). */
  label: string;
  /** Visual tier. To add a new tier, extend this union and add a matching `.award-chip-<level>` rule in App.css. */
  level: 'gold' | 'silver' | 'honorable';
  /** Full competition name shown in the lightbox. */
  competition?: string;
};

export type Artwork = {
  id: string;
  title: string;
  year: string;
  medium: string;
  dimensions: string;
  categories: string[];
  image: string;
  alt: string;
  /** Optional artist note shown in the lightbox below the award. */
  description?: string;
  /** Optional award, recognition, or honor. */
  award?: Award;
  /** Marks the fallback hero artwork when no dedicated hero image is configured. */
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
  email: 'alyssahgong@gmail.com',
  instagram: '',
  heroImage: 'artworks/alyssums.jpeg',
  statement:
    'Selected works drawing, printmaking, painting, mixed media, sculpture, and installation, centered on material exploration, memory, and personal visual language.',
  bio:
    `${artistName} is a high school senior artist working across drawing, printmaking, painting, mixed media, and installation. Her portfolio emphasizes layered surfaces, constructed forms, and material processes that connect observation with personal history.`,
  concentrationTitle: 'Material memory, identity, and inherited forms.',
  concentration:
    'The portfolio brings together finished works and process-focused studies to show how ideas move from observation into layered, tactile forms. Repeated materials such as bamboo, yarn, paper, print surfaces, and reflective elements build a visual language around memory, belonging, and transformation.',
  portraitNote:
    'Recent works include award-recognized pieces in printmaking, mixed media, drawing, painting, and installation.',
  contactNote: `For portfolio inquiries, email ${artistName} at alyssahgong@gmail.com.`,
};

const SCHOLASTIC = 'Scholastic Art Awards (Massachusetts Region)';
const CONGRESSIONAL = 'Congressional Art Competition (Massachusetts 5th District)';

export const artworks: Artwork[] = [
  // Gold Key — lead with the strongest work
  {
    id: 'the-thread-of-life',
    title: 'The Thread of Life',
    year: '2025',
    medium: 'Wood panel, Bamboo strips, Watercolor paper, Yupo paper, BFK paper, Gold leaf, Yarn, Mirror, Colored pencils, Acrylic paint, Watercolor paint, Water-based ink, Gesso, Hot glue, Golden GAC 100',
    dimensions: '130 x 100 x 36 inches',
    categories: ['Installation'],
    image: 'artworks/the-thread-of-life.jpeg',
    alt: 'Large installation titled The Thread of Life with bamboo, paper, yarn, mirror, and layered painted elements.',
    award: { label: 'Gold Key', level: 'gold', competition: SCHOLASTIC },
  },
  {
    id: 'alyssums',
    title: 'Alyssums',
    year: '2025',
    medium: 'Legion Drawing Paper, Golden Soft Gel, Water-based Ink, Acrylic Paint, Linocut, GAC100',
    dimensions: '11 x 27 inches',
    categories: ['Printmaking'],
    image: 'artworks/alyssums.jpeg',
    alt: 'Printmaking work titled Alyssums made with ink, acrylic paint, linocut, soft gel, and drawing paper.',
    award: { label: 'Gold Key', level: 'gold', competition: SCHOLASTIC },
  },
  {
    id: 'origins',
    title: 'Origins',
    year: '2025',
    medium: 'Polytab, Linocut, Wood panel',
    dimensions: '23 x 23 inches',
    categories: ['Printmaking', 'Mixed Media'],
    image: 'artworks/origins.jpeg',
    alt: 'Printmaking work titled Origins using polytab, linocut, and wood panel.',
    award: { label: 'Gold Key', level: 'gold', competition: SCHOLASTIC },
  },
  {
    id: 'collision',
    title: 'Collision',
    year: '2025',
    medium: 'Legion Drawing Paper, Golden Soft Gel, Linocut',
    dimensions: '14 x 11 inches',
    categories: ['Printmaking'],
    image: 'artworks/collision.jpeg',
    alt: 'Printmaking work titled Collision made with linocut, soft gel, and drawing paper.',
    award: { label: 'Gold Key', level: 'gold', competition: SCHOLASTIC },
  },
  // Silver Key + Congressional
  {
    id: 'rooted-in-bamboo',
    title: 'Rooted in Bamboo',
    year: '2025',
    medium: 'Canvas, Colored pencils, Acrylic paint',
    dimensions: '20 x 16 inches',
    categories: ['Drawing'],
    image: 'artworks/rooted-in-bamboo.jpeg',
    alt: 'Mixed media drawing titled Rooted in Bamboo with layered bamboo-like structures and green, cream, and dark forms.',
    award: { label: 'Silver Key', level: 'silver', competition: SCHOLASTIC },
    featured: true,
  },
  {
    id: 'is-it-all-a-fabrication',
    title: 'Is It All a Fabrication?',
    year: '2025',
    medium: 'Organza, Lace, Alcohol marker, Water-based face paint, Oil-based face paint, Nail polish, Que Bella face mask, My hand',
    dimensions: '15 x 12 x 5 inches',
    categories: ['Sculpture'],
    description: 'Handkerchief implies China and America, fabric implies fabrication, unsure if I change my reality',
    image: 'artworks/is-it-all-a-fabrication.jpeg',
    alt: 'Mixed material installation titled Is It All a Fabrication? using fabric, cosmetics, and hand-based forms.',
    award: { label: 'Silver Key', level: 'silver', competition: SCHOLASTIC },
  },
  {
    id: 'behind-the-screen',
    title: 'Behind the Screen',
    year: '2025',
    medium: 'Wood panel, Bamboo strips, Watercolor paper, Yupo paper, Acrylic paint, Gesso, Yarn, Mirror',
    dimensions: '40 x 50 inches',
    categories: ['Painting', 'Mixed Media'],
    image: 'artworks/behind-the-screen.jpeg',
    alt: 'Painting titled Behind the Screen built from wood panel, bamboo strips, paper, acrylic, yarn, and mirror.',
    award: { label: 'Silver Key', level: 'silver', competition: SCHOLASTIC },
  },
  {
    id: 'salad-bowl-of-america',
    title: 'Salad Bowl of America',
    year: '2025',
    medium: 'Painting',
    dimensions: '14 x 11 inches',
    categories: ['Painting'],
    description: 'Five hands forming a star, each paired with Smithsonian artifacts from their cultures, against iconic American landmarks, symbolizing that the American people define what it means to be American',
    image: 'artworks/salad-bowl-of-america.jpeg',
    alt: 'Painting titled Salad Bowl of America.',
    award: { label: '2nd Place', level: 'silver', competition: CONGRESSIONAL },
  },
  // Honorable Mentions — varied by medium
  {
    id: 'two-worlds',
    title: 'Two Worlds',
    year: '2025',
    medium: 'Wood Panel, Yarn, Golden Soft Gel, Resin, Mirror, GAC100',
    dimensions: '13 x 22 inches',
    categories: ['Mixed Media'],
    image: 'artworks/two-worlds.jpeg',
    alt: 'Mixed media work titled Two Worlds combining wood panel, yarn, resin, mirror, and gel medium.',
    award: { label: 'Honorable Mention', level: 'honorable', competition: SCHOLASTIC },
  },
  {
    id: 'warped',
    title: 'Warped',
    year: '2025',
    medium: 'Colored pencils',
    dimensions: '15 x 15 inches',
    categories: ['Drawing'],
    image: 'artworks/warped.jpeg',
    alt: 'Colored pencil drawing titled Warped with distorted organic forms and layered blue-green tones.',
    award: { label: 'Honorable Mention', level: 'honorable', competition: SCHOLASTIC },
  },
  {
    id: 'fragile',
    title: 'Fragile',
    year: '2025',
    medium: 'BFK paper, Canvas, Linocut, Water based ink, Yarn, Screws, Embroidery floss',
    dimensions: '40 x 32 inches',
    categories: ['Mixed Media'],
    image: 'artworks/fragile.jpeg',
    alt: 'Mixed media work titled Fragile combining paper, canvas, linocut, yarn, screws, and embroidery floss.',
    award: { label: 'Honorable Mention', level: 'honorable', competition: SCHOLASTIC },
  },
  // No award — interleaved so the grid doesn't end on these
  {
    id: 'the-smell-of-the-past',
    title: 'The Smell of the Past',
    year: '2025',
    medium: 'Acrylic paint, canvas, watercolor paper, watercolor paint, hot glue',
    dimensions: '14 x 11 inches',
    categories: ['Painting'],
    image: 'artworks/the-smell-of-the-past.jpeg',
    alt: 'Painting titled The Smell of the Past made with acrylic paint, canvas, watercolor paper, watercolor, and hot glue.',
  },
  {
    id: 'glazed',
    title: 'Glazed',
    year: '2025',
    medium: 'Organza, lace, markers, water-based face paint, oil-based face paint, nail polish, face mask, hand',
    dimensions: '14 x 11 inches',
    categories: ['Sculpture'],
    description: 'Handkerchief implies China and America, fabric implies fabrication, unsure if I change my reality',
    image: 'artworks/ap3d-1-2.jpeg',
    alt: 'Installation work titled AP3D 1-2.',
  },
  {
    id: 'contained',
    title: 'Contained',
    year: '2025',
    medium: 'Acrylic paint, plaster, nail polish, flower petals, rice vinegar, wooden box',
    dimensions: '14 x 11 inches',
    categories: ['Installation', 'Sculpture'],
    description: 'society\'s hands presses down on box (pandora\'s box) - stops different reality of femininity',
    image: 'artworks/ap3d-3-1.jpeg',
    alt: 'Installation work titled AP3D 3-1.',
  },
  {
    id: 'one-plate',
    title: 'One Plate',
    year: '2025',
    medium: 'Terracotta - China, tin foil, newsprint + colored pencil - childhood mediums, copper wire - US, yarn',
    dimensions: '14 x 11 inches',
    categories: ['Installation', "Sculpture"],
    description: 'two different realities (my cousin and I), different materials, shared space, dawning of validity',
    image: 'artworks/ap3d-4-1.jpeg',
    alt: 'Installation work titled AP3D 4-1.',
  },
  // Close with Honorable Mentions
  {
    id: 'printed',
    title: 'Printed',
    year: '2025',
    medium: 'BFK paper, Ink, Linocut',
    dimensions: '14 x 11 inches',
    categories: ['Printmaking'],
    image: 'artworks/printed.jpeg',
    alt: 'Printmaking work titled Printed made with BFK paper, ink, and linocut.',
    award: { label: 'Honorable Mention', level: 'honorable', competition: SCHOLASTIC },
  },
  {
    id: 'the-roots',
    title: 'The Roots',
    year: '2025',
    medium: 'Polytab, Golden soft gel, Yupo paper, Colored pencils, Embroidery floss, Wood panels, Gold leaf',
    dimensions: '18 x 18 inches',
    categories: ['Mixed Media'],
    image: 'artworks/the-roots.jpeg',
    alt: 'Mixed media work titled The Roots with layered paper, colored pencil, embroidery floss, wood panels, and gold leaf.',
    award: { label: 'Honorable Mention', level: 'honorable', competition: SCHOLASTIC },
  },
  {
    id: 'home',
    title: 'Home',
    year: '2025',
    medium: 'Popsicle sticks, Wood glue, Hot glue, Colored pencil, Newsprint',
    dimensions: '5.25 x 10 x 6 inches',
    categories: ['Mixed Media'],
    description: 'Reliability of childhood memories and how it changes my reality',
    image: 'artworks/home.jpeg',
    alt: 'Mixed media sculpture titled Home built with popsicle sticks, newsprint, and colored pencil.',
    award: { label: 'Honorable Mention', level: 'honorable', competition: SCHOLASTIC },
  },
  {
    id: 'still-life',
    title: 'Still Life',
    year: '2023',
    medium: '',
    dimensions: '14 x 11 iches',
    categories: ['Drawing'],
    image: 'artworks/still-life.jpeg',
    alt: 'Mixed media sculpture titled Home built with popsicle sticks, newsprint, and colored pencil.',
    award: { label: 'Honorable Mention', level: 'honorable', competition: SCHOLASTIC },
  },
  {
    id: 'friends',
    title: 'Friends',
    year: '2023',
    medium: '',
    dimensions: '14 x 11 iches',
    categories: ['Drawing'],
    image: 'artworks/friends.jpeg',
    alt: 'Mixed media sculpture titled Home built with popsicle sticks, newsprint, and colored pencil.',
  },
  {
    id: 'fruits',
    title: 'Fruits',
    year: '2023',
    medium: '',
    dimensions: '14 x 11 iches',
    categories: ['Drawing'],
    image: 'artworks/fruits.jpeg',
    alt: 'Mixed media sculpture titled Home built with popsicle sticks, newsprint, and colored pencil.',
    award: { label: 'Honorable Mention', level: 'honorable', competition: SCHOLASTIC },
  },
  {
    id: 'desk',
    title: 'Desk',
    year: '2023',
    medium: '',
    dimensions: '14 x 11 iches',
    categories: ['Drawing'],
    image: 'artworks/desk.jpeg',
    alt: 'Mixed media sculpture titled Home built with popsicle sticks, newsprint, and colored pencil.',
  },
  {
    id: 'self-portrait',
    title: 'Self Portrait',
    year: '2023',
    medium: '',
    dimensions: '14 x 11 iches',
    categories: ['Drawing'],
    image: 'artworks/self-portrait.jpeg',
    alt: 'Mixed media sculpture titled Home built with popsicle sticks, newsprint, and colored pencil.',
  },
  {
    id: 'objects',
    title: 'Objects',
    year: '2023',
    medium: '',
    dimensions: '14 x 11 iches',
    categories: ['Drawing'],
    image: 'artworks/objects.jpeg',
    alt: 'Mixed media sculpture titled Home built with popsicle sticks, newsprint, and colored pencil.',
  },
];

export const concentrationPoints: NarrativeBlock[] = [
  {
    title: 'Material Memory',
    description:
      'Repeated structures, threads, roots, and reflective surfaces connect personal memory with physical materials.',
  },
  {
    title: 'Material Range',
    description:
      'Colored pencil, printmaking, fabric, wood, bamboo, mirror, gold leaf, and paper processes create a varied but connected body of work.',
  },
  {
    title: 'Constructed Space',
    description:
      'The portfolio moves between intimate drawing surfaces and installation-scale pieces, giving the same questions multiple physical forms.',
  },
];

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
