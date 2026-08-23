/**
 * Every app the e2e suite can point a browser at, described once.
 *
 * Two tables, because they answer two different questions:
 *
 *   `apps`  — what has to be *running*. One entry per dev server, and the only
 *             place a package name or a port appears in this package.
 *   `pages` — what a spec can *navigate to*, and which app serves it. Nearly
 *             1:1 with `apps`, except `reactEmbedding`, a second page of the
 *             same react server. consts.ts turns this into the `projects` URL
 *             map the specs import; ../e2e-groups.ts uses it to check that a
 *             group boots the servers its specs actually need.
 *
 * Ports also live in test-apps/<app>/package.json. scripts/dev-ports.sh is the
 * shared source both read, each defaulting to its historical value, so a shell
 * that has not sourced it behaves exactly as before.
 */
export type App = {
  /** pnpm package name, for `pnpm --filter <pkg> dev`. */
  pkg: string;
  /** Env var scripts/dev-ports.sh exports for this app. */
  portEnv: string;
  /** Historical port, used when that var is unset. */
  port: number;
};

/**
 * In port order, which is also the order playwright.config.ts starts them in.
 */
export const apps = {
  web: { pkg: "@locator/web", portEnv: "PORT_WEB", port: 3342 },
  react: {
    pkg: "@locator/vite-react-project",
    portEnv: "PORT_REACT",
    port: 3343,
  },
  solid: { pkg: "vite-solid-project", portEnv: "PORT_SOLID", port: 3345 },
  preact: { pkg: "vite-preact-project", portEnv: "PORT_PREACT", port: 3346 },
  svelte: { pkg: "vite-svelte-project", portEnv: "PORT_SVELTE", port: 3347 },
  reactClean: {
    pkg: "vite-react-clean-project",
    portEnv: "PORT_REACT_CLEAN",
    port: 3348,
  },
  svelteClean: {
    pkg: "vite-svelte-clean-project",
    portEnv: "PORT_SVELTE_CLEAN",
    port: 3349,
  },
  vue: { pkg: "vite-vue-project", portEnv: "PORT_VUE", port: 3350 },
  next16: { pkg: "next-16", portEnv: "PORT_NEXT_16", port: 3352 },
  next16Turbopack: {
    pkg: "next-16-turbopack",
    portEnv: "PORT_NEXT_16_TURBO",
    port: 3353,
  },
} satisfies Record<string, App>;

export type AppKey = keyof typeof apps;

/** Every app, in port order. */
export const appKeys = Object.keys(apps) as AppKey[];

type Page = {
  app: AppKey;
  /** Appended to the app's origin. Omitted means the app's root. */
  path?: string;
};

const pages = {
  web: { app: "web" },
  react: { app: "react" },
  reactEmbedding: { app: "react", path: "embedding.html" },
  solid: { app: "solid" },
  preact: { app: "preact" },
  svelte: { app: "svelte" },
  reactClean: { app: "reactClean" },
  svelteClean: { app: "svelteClean" },
  vue: { app: "vue" },
  next16: { app: "next16" },
  next16Turbopack: { app: "next16Turbopack" },
} satisfies Record<string, Page>;

export type PageKey = keyof typeof pages;

/** Which server has to be running for this page to load. */
export const appServing = (key: PageKey): AppKey => pages[key].app;

export const appOrigin = (key: AppKey): string => {
  const app = apps[key];
  return `http://localhost:${process.env[app.portEnv] ?? app.port}/`;
};

export const pageUrl = (key: PageKey): string => {
  // Widened because `satisfies` leaves `path` absent from the entries without
  // one, so the union of literal types has no common `path` property.
  const page: Page = pages[key];
  return appOrigin(page.app) + (page.path ?? "");
};
