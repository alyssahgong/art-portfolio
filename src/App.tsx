import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  // BookOpen, // used by process section
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Instagram,
  // Layers, // used by process section
  Mail,
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
  artworks,
  concentrationPoints,
  // processHighlights, // hidden until process section is ready
} from './data/portfolio';
import artworkDimensions from 'virtual:artwork-dimensions';

const categories = ['All', ...Array.from(new Set(artworks.flatMap((artwork) => artwork.categories)))];
const fallbackHeroArtwork = artworks.find((artwork) => artwork.featured) ?? artworks[0];
// const processIcons = [BookOpen, Layers, Palette]; // hidden until process section is ready

function formatCategories(categories: string[]) {
  return categories.join(' / ');
}

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path}`;
}

function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [isFullSize, setIsFullSize] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const hasArtistFacts = Boolean(artist.location || artist.instagram);
  const heroImage = artist.heroImage || fallbackHeroArtwork.image;

  const visibleArtworks = useMemo(() => {
    if (activeCategory === 'All') {
      return artworks;
    }

    return artworks.filter((artwork) => artwork.categories.includes(activeCategory));
  }, [activeCategory]);

  const visibleIds = useMemo(
    () => visibleArtworks.map((artwork) => artwork.id),
    [visibleArtworks],
  );

  const lightboxArtwork = useMemo(
    () => (lightboxId ? artworks.find((artwork) => artwork.id === lightboxId) ?? null : null),
    [lightboxId],
  );

  const lightboxIndex = lightboxId ? visibleIds.indexOf(lightboxId) : -1;
  const hasPrev = lightboxIndex > 0;
  const hasNext = lightboxIndex >= 0 && lightboxIndex < visibleIds.length - 1;

  const openLightbox = useCallback((artworkId: string) => {
    setIsFullSize(false);
    setLightboxId(artworkId);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxId(null);
    setIsFullSize(false);
  }, []);

  const closeNav = useCallback(() => setIsNavOpen(false), []);

  const showPrev = useCallback(() => {
    if (lightboxIndex > 0) {
      setLightboxId(visibleIds[lightboxIndex - 1]);
    }
  }, [lightboxIndex, visibleIds]);

  const showNext = useCallback(() => {
    if (lightboxIndex >= 0 && lightboxIndex < visibleIds.length - 1) {
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

  return (
    <div className="site-shell">
      <a className="skip-link" href="#works">
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
          <a href="#works" onClick={closeNav}>Works</a>
          <a href="#theme" onClick={closeNav}>Theme</a>
          {/* <a href="#process" onClick={closeNav}>Process</a> */}
          <a href="#profile" onClick={closeNav}>Profile</a>
          <a href="#contact" onClick={closeNav}>Contact</a>
        </div>
      </nav>

      <header
        className="hero"
        id="top"
        style={{ backgroundImage: `url(${assetUrl(heroImage)})` }}
      >
        <div className="hero-shade" />
        <div className="hero-content">
          <h1>{artist.name}</h1>
          <p className="hero-copy">{artist.statement}</p>
          <div className="hero-actions" aria-label="Primary actions">
            <a className="button button-primary" href="#works">
              Selected Works
              <ArrowUpRight aria-hidden="true" size={18} strokeWidth={1.8} />
            </a>
            <a className="button button-secondary" href={artist.email ? `mailto:${artist.email}` : '#contact'}>
              Contact
              <Mail aria-hidden="true" size={18} strokeWidth={1.8} />
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="section works-section" id="works">
          <div className="section-inner">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Portfolio</p>
                <h2>Selected Works</h2>
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
                {categories.map((category) => (
                  <button
                    aria-pressed={activeCategory === category}
                    className="category-tab"
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="work-grid">
              {visibleArtworks.map((artwork) => {
                const { award } = artwork;

                return (
                  <article className="work-card" id={artwork.id} key={artwork.id}>
                    <img
                      className="work-image"
                      src={assetUrl(artwork.image)}
                      alt={artwork.alt}
                      style={{ aspectRatio: artworkDimensions[artwork.image] ?? '4 / 5' }}
                    />
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
                      {award && (
                        <span className={`award-chip award-chip-${award.level}`}>
                          {award.label}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section theme-section" id="theme">
          <div className="section-inner theme-grid">
            <div className="section-intro">
              <p className="eyebrow">Concentration</p>
              <h2>{artist.concentrationTitle}</h2>
            </div>
            <div className="theme-copy">
              <p>{artist.concentration}</p>
              <div className="theme-points">
                {concentrationPoints.map((point) => (
                  <article className="theme-point" key={point.title}>
                    <h3>{point.title}</h3>
                    <p>{point.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

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
                      src={assetUrl(processArtwork.image)}
                      alt=""
                      style={{ aspectRatio: artworkDimensions[processArtwork.image] ?? '4 / 5' }}
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

        <section className="section profile-section" id="profile">
          <div className="section-inner profile-grid">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>Artist profile and statement.</h2>
              <img
                className="artist-portrait"
                src={assetUrl('portrait.jpg')}
                alt={`Portrait of ${artist.name}`}
              />
            </div>
            <div className="profile-copy">
              <p>{artist.bio}</p>
              <p>{artist.statement}</p>
              <p>{artist.portraitNote}</p>
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

      <footer className="site-footer" id="contact">
        <div className="section-inner footer-grid">
          <div>
            <p className="eyebrow">Contact</p>
            <h2>Portfolio inquiries.</h2>
          </div>
          <div className="footer-actions">
            {artist.email ? (
              <a className="button button-primary" href={`mailto:${artist.email}`}>
                {artist.email}
                <Mail aria-hidden="true" size={18} strokeWidth={1.8} />
              </a>
            ) : (
              <p className="footer-note">{artist.contactNote}</p>
            )}
            {artist.instagram && (
              <a className="button button-secondary" href={artist.instagram} target="_blank" rel="noreferrer">
                Instagram
                <Instagram aria-hidden="true" size={18} strokeWidth={1.8} />
              </a>
            )}
          </div>
        </div>
        <div className="section-inner footer-copyright">
          <p>© {new Date().getFullYear()} {artist.name}. All artwork rights reserved.</p>
        </div>
      </footer>

      {lightboxArtwork && (
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
                href={assetUrl(lightboxArtwork.image)}
                target="_blank"
                rel="noreferrer"
                aria-label="Open original image in a new tab"
                title="Open original"
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
              <img
                src={assetUrl(lightboxArtwork.image)}
                alt={lightboxArtwork.alt}
              />
            </div>
            <div className="lightbox-copy">
              <p className="eyebrow">
                {formatCategories(lightboxArtwork.categories)} · {lightboxArtwork.year}
              </p>
              <h2 id="lightbox-title">{lightboxArtwork.title}</h2>
              {lightboxArtwork.award && (
                <div className="lightbox-award">
                  <span className={`award-chip award-chip-${lightboxArtwork.award.level}`}>
                    {lightboxArtwork.award.label}
                  </span>
                  {lightboxArtwork.award.competition && (
                    <span className="lightbox-award-competition">
                      {lightboxArtwork.award.competition}
                    </span>
                  )}
                </div>
              )}
              {lightboxArtwork.description && (
                <p className="lightbox-description">{lightboxArtwork.description}</p>
              )}
              <dl className="work-details lightbox-details">
                <div>
                  <dt>Material</dt>
                  <dd>{lightboxArtwork.medium}</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{lightboxArtwork.dimensions}</dd>
                </div>
              </dl>
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