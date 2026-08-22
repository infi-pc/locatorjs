/**
 * Ports come from the same env vars that scripts/dev-ports.sh exports, each
 * defaulting to its historical value. So this behaves exactly as before unless
 * that script has been sourced, in which case the whole suite follows the
 * shifted port block.
 */
const port = (name: string, fallback: number): string =>
  process.env[name] ?? String(fallback);

export const projects = {
  web: `http://localhost:${port("PORT_WEB", 3342)}/`,
  react: `http://localhost:${port("PORT_REACT", 3343)}/`,
  reactEmbedding: `http://localhost:${port("PORT_REACT", 3343)}/embedding.html`,
  solid: `http://localhost:${port("PORT_SOLID", 3345)}/`,
  preact: `http://localhost:${port("PORT_PREACT", 3346)}/`,
  svelte: `http://localhost:${port("PORT_SVELTE", 3347)}/`,
  reactClean: `http://localhost:${port("PORT_REACT_CLEAN", 3348)}/`,
  svelteClean: `http://localhost:${port("PORT_SVELTE_CLEAN", 3349)}/`,
  vue: `http://localhost:${port("PORT_VUE", 3350)}/`,
  next16: `http://localhost:${port("PORT_NEXT_16", 3352)}/`,
  next16Turbopack: `http://localhost:${port("PORT_NEXT_16_TURBO", 3353)}/`,
};
