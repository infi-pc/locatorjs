import { pageUrl, type PageKey } from "./apps";

/**
 * Every URL the specs navigate to. Package names and ports live in apps.ts,
 * which is also what playwright.config.ts builds its webServer array from, so
 * this package has one port list instead of two.
 *
 * Spelled out one line per page rather than generated from that table, so it
 * stays greppable from a spec. `satisfies` is what keeps it honest: a page
 * added to apps.ts and missed here is a type error rather than a silently
 * absent entry, and a typo here is a type error too.
 */
export const projects = {
  web: pageUrl("web"),
  react: pageUrl("react"),
  reactEmbedding: pageUrl("reactEmbedding"),
  solid: pageUrl("solid"),
  preact: pageUrl("preact"),
  svelte: pageUrl("svelte"),
  reactClean: pageUrl("reactClean"),
  svelteClean: pageUrl("svelteClean"),
  vue: pageUrl("vue"),
  next16: pageUrl("next16"),
  next16Turbopack: pageUrl("next16Turbopack"),
} satisfies Record<PageKey, string>;
