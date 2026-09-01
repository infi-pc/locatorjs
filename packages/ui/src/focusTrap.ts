const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function activeElement(container: HTMLElement): Element | null {
  const root = container.getRootNode();
  return root && "activeElement" in root
    ? (root.activeElement as Element | null)
    : document.activeElement;
}

/** Keeps keyboard focus inside an overlay and gives Escape one reliable owner. */
export function trapOverlayFocus(
  event: KeyboardEvent,
  container: HTMLElement,
  onClose: () => void
): void {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    onClose();
    return;
  }
  if (event.key !== "Tab") return;

  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector)
  ).filter((element) => !element.hidden && element.tabIndex >= 0);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) {
    event.preventDefault();
    container.focus();
    return;
  }

  const active = activeElement(container);
  if (event.shiftKey && (active === first || active === container)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
