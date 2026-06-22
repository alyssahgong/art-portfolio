/// <reference types="vite/client" />

declare module 'virtual:artwork-dimensions' {
  /** Map of image path (relative to `public/`) to a `"width / height"` CSS aspect-ratio string. */
  const dimensions: Record<string, string>;
  export default dimensions;
}
