import { FRAMEWORK_LABELS, type FrameworkId } from "@locator/shared";
import { css, cx } from "@locator/styled-system/css";
import {
  Ban,
  CircleAlert,
  Power,
  RefreshCw,
  Search,
  TriangleAlert,
  type LucideProps,
} from "lucide-solid";
import { Show, type Component, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Button } from "./Button";

/**
 * What the popup shows above the settings when the page is not simply
 * connected. Each screen is one sentence of diagnosis, one sentence of next
 * step, and at most one button. A connected page renders no card at all.
 */
export type PageStatusScreen =
  /** The page agent has not concluded anything yet. */
  | { kind: "probing" }
  /** Rendered page, nothing Locator supports on it. */
  | { kind: "no-framework"; unsupported: string[] }
  /** A supported framework without its dev-only source metadata. */
  | { kind: "no-source-info"; frameworks: FrameworkId[] }
  /** The client script was blocked or failed to load. */
  | { kind: "client-failed"; detail: string }
  /** Locator is switched off in the All-sites settings. */
  | { kind: "disabled-everywhere" }
  /** Locator is switched off for this site. */
  | { kind: "disabled-here" }
  /** No content script: browser-internal pages, the store, PDFs. */
  | { kind: "restricted-page" }
  /** The extension updated while the page was open. */
  | { kind: "reload-required" }
  /** The page reports a running client, but it did not answer the popup. */
  | { kind: "runtime-unreachable" };

export type PageStatusScreenKind = PageStatusScreen["kind"];

type Tone = "neutral" | "info" | "warning" | "error";

const SETUP_GUIDES = "https://www.locatorjs.com/install";

const FRAMEWORK_GUIDES: Record<FrameworkId, string> = {
  react: `${SETUP_GUIDES}/react`,
  vue: `${SETUP_GUIDES}/vue`,
  svelte: `${SETUP_GUIDES}/svelte`,
  jsx: SETUP_GUIDES,
};

const styles = {
  card: css({
    layerStyle: "card",
    display: "flex",
    flexDirection: "column",
    gap: "2",
    p: "3",
  }),
  header: css({ alignItems: "flex-start", display: "flex", gap: "2.5" }),
  icon: css({
    alignItems: "center",
    borderRadius: "l2",
    borderWidth: "1px",
    display: "inline-flex",
    flexShrink: 0,
    height: "8",
    justifyContent: "center",
    width: "8",
  }),
  neutral: css({
    bg: "gray.subtle.bg",
    borderColor: "gray.surface.border",
    color: "gray.subtle.fg",
  }),
  info: css({
    bg: "accent.subtle.bg",
    borderColor: "accent.surface.border",
    color: "accent.subtle.fg",
  }),
  warning: css({
    bg: "amber.subtle.bg",
    borderColor: "amber.surface.border",
    color: "amber.subtle.fg",
  }),
  error: css({
    bg: "red.subtle.bg",
    borderColor: "red.surface.border",
    color: "red.subtle.fg",
  }),
  text: css({ display: "flex", flexDirection: "column", gap: "1", minW: 0 }),
  headline: css({ color: "fg.default", fontSize: "md", fontWeight: "medium" }),
  body: css({ color: "fg.muted", fontSize: "sm", lineHeight: "1.5" }),
  actions: css({
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
    justifyContent: "flex-end",
  }),
  link: css({
    color: "accent.plain.fg",
    fontSize: "sm",
    marginRight: "auto",
    textDecoration: "underline",
    _hover: { color: "accent.solid.bg.hover" },
  }),
  details: css({ color: "fg.muted", fontSize: "xs" }),
  summary: css({ cursor: "pointer" }),
  detailText: css({
    overflowWrap: "anywhere",
    pt: "1",
    whiteSpace: "pre-wrap",
  }),
  error_text: css({ color: "red.plain.fg", fontSize: "xs" }),
};

function listNames(ids: FrameworkId[]): string {
  const names = ids.map((id) => FRAMEWORK_LABELS[id]);
  if (names.length <= 1) return names[0] ?? "A framework";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

type Presentation = {
  tone: Tone;
  icon: Component<LucideProps>;
  headline: string;
  body: string;
  /** Primary action, if the user can do something from the popup. */
  action?: "check-again" | "retry" | "enable" | "reload";
  link?: { href: string; label: string };
  detail?: string;
};

export function describePageStatusScreen(
  screen: PageStatusScreen
): Presentation {
  switch (screen.kind) {
    case "probing":
      return {
        tone: "neutral",
        icon: Search,
        headline: "Looking for your app…",
        body: "Locator checks the page as it renders. You can edit All sites meanwhile.",
      };
    case "no-framework": {
      const hint = screen.unsupported[0];
      return {
        tone: "neutral",
        icon: Search,
        headline: "No supported framework on this page",
        body: `${
          hint ? `This looks like ${aOrAn(hint)} ${hint} app. ` : ""
        }Locator works with React, Preact, Solid, Vue and Svelte apps running in development.`,
        action: "check-again",
        link: { href: SETUP_GUIDES, label: "Setup guides" },
      };
    }
    case "no-source-info": {
      const names = listNames(screen.frameworks);
      const verb = screen.frameworks.length > 1 ? "are" : "is";
      const svelteNote = screen.frameworks.includes("svelte")
        ? " Svelte also needs the compiler's dev option."
        : "";
      const guide = screen.frameworks[0]
        ? FRAMEWORK_GUIDES[screen.frameworks[0]]
        : SETUP_GUIDES;
      return {
        tone: "warning",
        icon: TriangleAlert,
        headline: `${names} ${verb} here, but without source locations`,
        body: `That usually means a production build. Start the dev server (for example npm run dev) and open that URL.${svelteNote}`,
        action: "check-again",
        link: { href: guide, label: "Setup guide" },
      };
    }
    case "client-failed":
      return {
        tone: "error",
        icon: CircleAlert,
        headline: "Locator couldn't start on this page",
        body: "The page blocked Locator's script. A strict Content-Security-Policy is the usual cause.",
        action: "retry",
        detail: screen.detail,
      };
    case "disabled-everywhere":
      return {
        tone: "neutral",
        icon: Power,
        headline: "Locator is turned off for all sites",
        body: "Turn it back on to use it here and everywhere else.",
        action: "enable",
      };
    case "disabled-here":
      return {
        tone: "neutral",
        icon: Power,
        headline: "Disabled on this page",
        body: "Locator is turned off for this site.",
        action: "enable",
      };
    case "restricted-page":
      return {
        tone: "neutral",
        icon: Ban,
        headline: "Locator can't run here",
        body: "Browsers block extensions on this kind of page. All sites settings still apply everywhere else.",
      };
    case "reload-required":
      return {
        tone: "info",
        icon: RefreshCw,
        headline: "Reload to finish updating Locator",
        body: "The extension updated while this page was open.",
        action: "reload",
      };
    case "runtime-unreachable":
      return {
        tone: "warning",
        icon: TriangleAlert,
        headline: "The page didn't answer",
        body: "Locator is on this page but didn't reply. Editing All sites until it does.",
      };
  }
}

function aOrAn(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

const ACTION_LABELS = {
  "check-again": "Check again",
  retry: "Retry",
  enable: "Turn on",
  reload: "Reload page",
} as const;

export function PageStatusCard(props: {
  screen: PageStatusScreen;
  /** Fired for "Check again" and "Retry". */
  onCheckAgain?: () => void;
  onEnable?: () => void;
  onReload?: () => void;
  busy?: boolean;
  /** Result of the last action, e.g. a write that did not persist. */
  error?: string;
  class?: string;
}): JSX.Element {
  const presentation = () => describePageStatusScreen(props.screen);
  const onAction = () => {
    switch (presentation().action) {
      case "check-again":
      case "retry":
        return props.onCheckAgain?.();
      case "enable":
        return props.onEnable?.();
      case "reload":
        return props.onReload?.();
    }
  };
  return (
    <section
      class={cx(styles.card, props.class)}
      role="status"
      aria-label="Page status"
    >
      <div class={styles.header}>
        <span class={cx(styles.icon, styles[presentation().tone])}>
          <Dynamic component={presentation().icon} size={16} />
        </span>
        <div class={styles.text}>
          <div class={styles.headline}>{presentation().headline}</div>
          <div class={styles.body}>{presentation().body}</div>
        </div>
      </div>
      <Show when={presentation().detail}>
        <details class={styles.details}>
          <summary class={styles.summary}>Details</summary>
          <div class={styles.detailText}>{presentation().detail}</div>
        </details>
      </Show>
      <Show when={presentation().action || presentation().link}>
        <div class={styles.actions}>
          <Show when={presentation().link}>
            {(link) => (
              <a class={styles.link} href={link().href} target="_blank">
                {link().label}
              </a>
            )}
          </Show>
          <Show when={presentation().action}>
            {(action) => (
              <Button
                variant={action() === "enable" ? "primary" : "outline"}
                disabled={props.busy}
                onClick={onAction}
              >
                {ACTION_LABELS[action()]}
              </Button>
            )}
          </Show>
        </div>
      </Show>
      <Show when={props.error}>
        <div class={styles.error_text} role="alert">
          {props.error}
        </div>
      </Show>
    </section>
  );
}
