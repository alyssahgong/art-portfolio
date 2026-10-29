import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  // BookOpen, // used by process section
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Images,
  Instagram,
  // Layers, // used by process section
  Menu,
  Maximize2,
  MapPin,
  Minimize2,
  // Palette, // used by process section
  X,
} from 'lucide-react';
import './App.css';
import {
  artist,
  // processHighlights, // hidden until process section is ready
  type Artwork,
  type Award,
} from './data/portfolio';
import { artworks } from './data/artworks.generated';

const categories = ['All', ...Array.from(new Set(artworks.flatMap((artwork) => artwork.categories)))];
const fallbackHeroArtwork = artworks.find((artwork) => artwork.featured) ?? artworks[0];
const heroArtwork = artworks.find((artwork) => artwork.title === artist.heroArtwork) ?? fallbackHeroArtwork;
// const processIcons = [BookOpen, Layers, Palette]; // hidden until process section is ready

const WORK_GRID_WIDE_QUERY = '(min-width: 921px)';
/** Reference column width (px) used only to compare relative card heights; the real column width doesn't matter since it cancels out across columns. */
const COLUMN_REFERENCE_WIDTH = 300;
const CAPTION_HEIGHT_ESTIMATE = 56;
const COLUMN_GAP_ESTIMATE = 16;

const AWARD_LEVEL_ORDER: Award['level'][] = ['gold', 'silver', 'honorable'];

type RecognitionGroup = {
  competition: string;
  awards: { award: Award; works: Artwork[] }[];
};

/** Groups awarded artworks by competition, then by award label (highest tier first), keeping portfolio order within each. */
function getRecognitionGroups(): RecognitionGroup[] {
  const groups: RecognitionGroup[] = [];

  for (const artwork of artworks) {
    const { award } = artwork;
    if (!award) {
      continue;
    }

    const competition = award.competition ?? 'Other Recognition';
    let group = groups.find((entry) => entry.competition === competition);
    if (!group) {
      group = { competition, awards: [] };
      groups.push(group);
    }

    const entry = group.awards.find((item) => item.award.label === award.label);
    if (entry) {
      entry.works.push(artwork);
    } else {
      group.awards.push({ award, works: [artwork] });
    }
  }

  for (const group of groups) {
    group.awards.sort(
      (a, b) => AWARD_LEVEL_ORDER.indexOf(a.award.level) - AWARD_LEVEL_ORDER.indexOf(b.award.level),
    );
  }

  return groups;
}

const recognitionGroups = getRecognitionGroups();

/** Caption of the view that earned a multi-view piece its award, e.g. "Fruits" for Still Life. */
function awardViewCaption(artwork: Artwork) {
  const view = artwork.award?.view;
  return view === undefined ? undefined : artwork.images[view]?.caption;
}

function formatCategories(categories: string[]) {
  return categories.join(' / ');
}

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path}`;
}

function useWorkColumnCount() {
  const [columnCount, setColumnCount] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(WORK_GRID_WIDE_QUERY).matches ? 3 : 2,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(WORK_GRID_WIDE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setColumnCount(event.matches ? 3 : 2);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return columnCount;
}

/** Assigns artworks to columns greedily, always extending whichever column is currently shortest, so the grid reads left-to-right in card order like real masonry layouts. */
function useWorkColumns(visibleArtworks: Artwork[], columnCount: number) {
  return useMemo(() => {
    const columns: Artwork[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights = new Array(columnCount).fill(0);

    for (const artwork of visibleArtworks) {
      const [width, height] = artwork.images[0].ratio.split('/').map(Number);
      const cardHeight =
        COLUMN_REFERENCE_WIDTH * (height / width) + CAPTION_HEIGHT_ESTIMATE + COLUMN_GAP_ESTIMATE;

      let shortestIndex = 0;
      for (let i = 1; i < columnHeights.length; i += 1) {
        if (columnHeights[i] < columnHeights[shortestIndex]) {
          shortestIndex = i;
        }
      }

      columns[shortestIndex].push(artwork);
      columnHeights[shortestIndex] += cardHeight;
    }

    return columns;
  }, [visibleArtworks, columnCount]);
}

function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [isFullSize, setIsFullSize] = useState(false);
  /** Which view of a multi-view piece the lightbox shows; reset to the cover whenever the piece changes. */
  const [viewIndex, setViewIndex] = useState(0);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const hasArtistFacts = Boolean(artist.location || artist.instagram);

  const categoryTabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [categoryIndicator, setCategoryIndicator] = useState({ left: 0, width: 0 });

  const setCategoryTabRef = useCallback((category: string, element: HTMLButtonElement | null) => {
    if (element) {
      categoryTabRefs.current.set(category, element);
    } else {
      categoryTabRefs.current.delete(category);
    }
  }, []);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const activeTab = categoryTabRefs.current.get(activeCategory);
      if (activeTab) {
        setCategoryIndicator({ left: activeTab.offsetLeft, width: activeTab.offsetWidth });
      }
    };

    updateIndicator();

    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeCategory]);

  const visibleArtworks = useMemo(() => {
    if (activeCategory === 'All') {
      return artworks;
    }

    return artworks.filter((artwork) => artwork.categories.includes(activeCategory));
  }, [activeCategory]);

  const workColumnCount = useWorkColumnCount();
  const workColumns = useWorkColumns(visibleArtworks, workColumnCount);

  const visibleIds = useMemo(
    () => visibleArtworks.map((artwork) => artwork.id),
    [visibleArtworks],
  );

  const hasArtistContext = Boolean(
    artist.school || artist.graduationYear || artist.courses.length || artist.programs.length,
  );

  const lightboxArtwork = useMemo(
    () => (lightboxId ? artworks.find((artwork) => artwork.id === lightboxId) ?? null : null),
    [lightboxId],
  );
  const lightboxView = lightboxArtwork ? lightboxArtwork.images[viewIndex] ?? lightboxArtwork.images[0] : null;

  const lightboxIndex = lightboxId ? visibleIds.indexOf(lightboxId) : -1;
  const hasPrev = lightboxIndex > 0;
  const hasNext = lightboxIndex >= 0 && lightboxIndex < visibleIds.length - 1;

  const openLightbox = useCallback((artworkId: string, view = 0) => {
    setIsFullSize(false);
    setViewIndex(view);
    setLightboxId(artworkId);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxId(null);
    setIsFullSize(false);
  }, []);

  const closeNav = useCallback(() => setIsNavOpen(false), []);

  const showPrev = useCallback(() => {
    if (lightboxIndex > 0) {
      setViewIndex(0);
      setLightboxId(visibleIds[lightboxIndex - 1]);
    }
  }, [lightboxIndex, visibleIds]);

  const showNext = useCallback(() => {
    if (lightboxIndex >= 0 && lightboxIndex < visibleIds.length - 1) {
      setViewIndex(0);
      setLightboxId(visibleIds[lightboxIndex + 1]);
    }
  }, [lightboxIndex, visibleIds]);

  useEffect(() => {
    if (!lightboxArtwork) {
      return;
    }

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isFullSize) {
          setIsFullSize(false);
        } else {
          closeLightbox();
        }
      } else if (event.key === 'ArrowLeft') {
        showPrev();
      } else if (event.key === 'ArrowRight') {
        showNext();
      }
    };

    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxArtwork, closeLightbox, showPrev, showNext, isFullSize]);

  const renderWorkGrid = (columns: Artwork[][]) => (
    <div className="work-grid">
      {columns.map((column, columnIndex) => (
        <div className="work-column" key={columnIndex}>
          {column.map((artwork) => (
            <article className="work-card" id={artwork.id} key={artwork.id}>
              <div className="work-image-frame">
                <img
                  className="work-image"
                  src={assetUrl(artwork.images[0].thumb)}
                  alt={artwork.alt}
                  loading="lazy"
                  decoding="async"
                  style={{ aspectRatio: artwork.images[0].ratio }}
                />
                {artwork.images.length > 1 && (
                  <span className="work-views">
                    <Images aria-hidden="true" size={13} strokeWidth={2} />
                    {artwork.images.length} views
                  </span>
                )}
              </div>
              <div className="work-caption">
                <h3>
                  <button
                    type="button"
                    className="work-link"
                    onClick={() => openLightbox(artwork.id)}
                    aria-label={`View ${artwork.title} in detail`}
                  >
                    {artwork.title}
                  </button>
                </h3>
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="site-shell">
      <a className="skip-link" href="#portfolio">
        Skip to portfolio
      </a>
      <nav className={`site-nav${isNavOpen ? ' is-open' : ''}`} aria-label="Main navigation">
        <a className="brand-mark" href="#top" onClick={closeNav}>
          {artist.name}
        </a>
        <button
          type="button"
          className="mobile-nav-toggle"
          aria-controls="site-nav-links"
          aria-expanded={isNavOpen}
          aria-label={isNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
          title={isNavOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsNavOpen((value) => !value)}
        >
          {isNavOpen ? (
            <X aria-hidden="true" size={20} strokeWidth={1.8} />
          ) : (
            <Menu aria-hidden="true" size={20} strokeWidth={1.8} />
          )}
        </button>
        <div className="nav-links" id="site-nav-links">
          <a href="#portfolio" onClick={closeNav}>Portfolio</a>
          {recognitionGroups.length > 0 && (
            <a href="#awards" onClick={closeNav}>Awards and Honors</a>
          )}
          {/* <a href="#process" onClick={closeNav}>Process</a> */}
          <a href="#statement" onClick={closeNav}>Artist Statement</a>
        </div>
      </nav>

      <header
        className="hero"
        id="top"
        style={{ backgroundImage: `url(${assetUrl(heroArtwork.images[0].large)})` }}
      >
        <div className="hero-shade" />
        <div className="hero-content">
          <h1>{artist.name}</h1>
          <p className="hero-copy">{artist.concentration}</p>
        </div>
      </header>

      <main>
        <section className="section works-section" id="portfolio">
          <div className="section-inner">
            <div className="section-heading">
              <div>
                <h2>Portfolio</h2>
              </div>
              <label className="visually-hidden" htmlFor="category-select">
                Artwork category
              </label>
              <select
                className="category-select"
                id="category-select"
                value={activeCategory}
                onChange={(event) => setActiveCategory(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <div className="category-tabs" role="tablist" aria-label="Artwork categories">
                <span
                  className="category-tab-indicator"
                  style={{ transform: `translateX(${categoryIndicator.left}px)`, width: categoryIndicator.width }}
                  aria-hidden="true"
                />
                {categories.map((category) => (
                  <button
                    aria-pressed={activeCategory === category}
                    className="category-tab"
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    ref={(element) => setCategoryTabRef(category, element)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {renderWorkGrid(workColumns)}
          </div>
        </section>

        {recognitionGroups.length > 0 && (
          <section className="section recognition-section" id="awards">
            <div className="section-inner intro-grid">
              <div className="section-intro">
                <h2>Awards and Honors</h2>
              </div>
              <div className="recognition-copy">
                {recognitionGroups.map((group) => (
                  <article className="recognition-group" key={group.competition}>
                    <h3>{group.competition}</h3>
                    <ul className="recognition-list">
                      {group.awards.map(({ award, works }) => (
                        <li className="recognition-row" key={award.label}>
                          <span className={`award-chip award-chip-${award.level}`}>
                            {award.label}
                          </span>
                          <span className="recognition-works">
                            {works.map((artwork, index) => (
                              <span key={artwork.id}>
                                <button
                                  type="button"
                                  className="recognition-work"
                                  onClick={() => openLightbox(artwork.id, artwork.award?.view)}
                                >
                                  {artwork.title}
                                  {awardViewCaption(artwork) && ` (${awardViewCaption(artwork)})`}
                                </button>
                                {index < works.length - 1 && ', '}
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}

                {hasArtistContext && (
                  <dl className="work-details recognition-context">
                    {(artist.school || artist.graduationYear) && (
                      <div>
                        <dt>School</dt>
                        <dd>
                          {[artist.school, artist.graduationYear && `Class of ${artist.graduationYear}`]
                            .filter(Boolean)
                            .join(', ')}
                        </dd>
                      </div>
                    )}
                    {artist.courses.length > 0 && (
                      <div>
                        <dt>Art Coursework</dt>
                        <dd>{artist.courses.join(', ')}</dd>
                      </div>
                    )}
                    {artist.programs.length > 0 && (
                      <div>
                        <dt>Programs & Exhibitions</dt>
                        <dd>{artist.programs.join(', ')}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Process section hidden until content is ready
        <section className="section process-section" id="process">
          <div className="section-inner">
            <div className="section-heading compact-heading">
              <div>
                <p className="eyebrow">Process & Studies</p>
                <h2>How the work develops.</h2>
              </div>
            </div>
            <div className="process-grid">
              {processHighlights.map((highlight, index) => {
                const Icon = processIcons[index % processIcons.length];
                const processArtwork = artworks[index + 3] ?? fallbackHeroArtwork;

                return (
                  <article className="process-card" key={highlight.title}>
                    <img
                      className="process-image"
                      src={assetUrl(processArtwork.images[0].thumb)}
                      alt=""
                      style={{ aspectRatio: processArtwork.images[0].ratio }}
                    />
                    <div className="process-copy">
                      <span className="icon-chip" aria-hidden="true">
                        <Icon size={18} strokeWidth={1.8} />
                      </span>
                      <h3>{highlight.title}</h3>
                      <p>{highlight.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        */}

        <section className="section profile-section" id="statement">
          <div className="section-inner profile-grid">
            <div>
              <h2>Artist Statement</h2>
            </div>
            <div className="profile-copy">
              {artist.statement.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {hasArtistFacts && (
                <div className="artist-facts" aria-label="Artist details">
                  {artist.location && (
                    <span>
                      <MapPin aria-hidden="true" size={18} strokeWidth={1.8} />
                      {artist.location}
                    </span>
                  )}
                  {artist.instagram && (
                    <a href={artist.instagram} target="_blank" rel="noreferrer">
                      <Instagram aria-hidden="true" size={18} strokeWidth={1.8} />
                      Instagram
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      <footer className="site-footer">
        <div className="section-inner footer-copyright">
          <p>© {new Date().getFullYear()} {artist.name}. All artwork rights reserved.</p>
        </div>
      </footer>

      {lightboxArtwork && lightboxView && (
        <div
          className={`lightbox${isFullSize ? ' is-fullsize' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          onClick={closeLightbox}
        >
          <div
            className={`lightbox-dialog${isFullSize ? ' is-fullsize' : ''}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="lightbox-toolbar">
              <a
                className="lightbox-tool"
                href={assetUrl(lightboxView.full)}
                target="_blank"
                rel="noreferrer"
                aria-label="Open full image in a new tab"
                title="Open image in new tab"
              >
                <ExternalLink aria-hidden="true" size={18} strokeWidth={1.8} />
              </a>
              <button
                type="button"
                className="lightbox-tool"
                onClick={() => setIsFullSize((value) => !value)}
                aria-label={isFullSize ? 'Exit full size view' : 'View full size'}
                aria-pressed={isFullSize}
                title={isFullSize ? 'Exit full size' : 'View full size'}
              >
                {isFullSize ? (
                  <Minimize2 aria-hidden="true" size={18} strokeWidth={1.8} />
                ) : (
                  <Maximize2 aria-hidden="true" size={18} strokeWidth={1.8} />
                )}
              </button>
              <button
                type="button"
                className="lightbox-tool"
                onClick={closeLightbox}
                aria-label="Close artwork detail"
                title="Close"
              >
                <X aria-hidden="true" size={22} strokeWidth={1.8} />
              </button>
            </div>
            <div className="lightbox-figure">
              {/* Full size shows the original at its actual pixel size (one image pixel per screen pixel); scroll to pan. */}
              <img
                src={assetUrl(isFullSize ? lightboxView.full : lightboxView.large)}
                style={
                  isFullSize
                    ? {
                        width: lightboxView.width / window.devicePixelRatio,
                        height: lightboxView.height / window.devicePixelRatio,
                      }
                    : undefined
                }
                alt={lightboxView.caption ? `${lightboxArtwork.alt} (${lightboxView.caption})` : lightboxArtwork.alt}
              />
              {lightboxArtwork.images.length > 1 && (
                <p className="lightbox-view-count" aria-live="polite">
                  {viewIndex + 1} / {lightboxArtwork.images.length}
                  {lightboxView.caption && ` · ${lightboxView.caption}`}
                </p>
              )}
            </div>
            <div className="lightbox-copy">
              <p className="eyebrow">
                {[formatCategories(lightboxArtwork.categories), lightboxArtwork.year]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <h2 id="lightbox-title">{lightboxArtwork.title}</h2>
              {lightboxArtwork.award && (
                <div className="lightbox-award">
                  <span className={`award-chip award-chip-${lightboxArtwork.award.level}`}>
                    {lightboxArtwork.award.label}
                  </span>
                  {(lightboxArtwork.award.competition || awardViewCaption(lightboxArtwork)) && (
                    <span className="lightbox-award-competition">
                      {[lightboxArtwork.award.competition, awardViewCaption(lightboxArtwork) && `for ${awardViewCaption(lightboxArtwork)}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </div>
              )}
              {lightboxArtwork.images.length > 1 && (
                <div className="lightbox-views">
                  <p className="lightbox-views-label">{lightboxArtwork.images.length} Views</p>
                  <div className="lightbox-view-thumbs" aria-label="Views of this artwork">
                    {lightboxArtwork.images.map((view, index) => (
                      <button
                        type="button"
                        className="lightbox-view-thumb"
                        key={view.thumb}
                        aria-label={`View ${index + 1}${view.caption ? `: ${view.caption}` : ''}`}
                        aria-pressed={index === viewIndex}
                        onClick={() => setViewIndex(index)}
                      >
                        <img src={assetUrl(view.thumb)} alt="" />
                        <span>{view.caption ?? `View ${index + 1}`}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {lightboxArtwork.description && (
                <p className="lightbox-description">{lightboxArtwork.description}</p>
              )}
              {(lightboxArtwork.medium || lightboxArtwork.dimensions) && (
                <dl className="work-details lightbox-details">
                  {lightboxArtwork.medium && (
                    <div>
                      <dt>Material</dt>
                      <dd>{lightboxArtwork.medium}</dd>
                    </div>
                  )}
                  {lightboxArtwork.dimensions && (
                    <div>
                      <dt>Size</dt>
                      <dd>{lightboxArtwork.dimensions}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
            {(hasPrev || hasNext) && (
              <div className="lightbox-nav" aria-label="Artwork navigation">
                <button
                  type="button"
                  onClick={showPrev}
                  disabled={!hasPrev}
                  aria-label="Previous artwork"
                >
                  <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.8} />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  disabled={!hasNext}
                  aria-label="Next artwork"
                >
                  Next
                  <ChevronRight aria-hidden="true" size={20} strokeWidth={1.8} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;