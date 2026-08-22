/**
 * Modifier state sharing between frames.
 *
 * Keyboard events go only to the focused document. Hold Alt in the top document
 * and move the mouse into an iframe and that iframe's runtime never learns the
 * key is down, so nothing highlights. Each runtime therefore broadcasts its own
 * modifier state to the frames around it, and forwards what it receives one hop
 * further so nested frames stay in sync too.
 *
 * Only the four modifier booleans travel across the boundary, which keeps this
 * safe to accept from cross-origin frames.
 */

const MESSAGE_TYPE = "LOCATOR_FRAME_MODIFIERS";

export type ModifierState = {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

type ModifierMessage = ModifierState & {
  type: typeof MESSAGE_TYPE;
  /** Limits forwarding so a frame tree cannot echo a message forever. */
  hops: number;
};

const MAX_HOPS = 8;

export function modifiersFromEvent(event: KeyboardEvent): ModifierState {
  return {
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  };
}

function post(target: Window, message: ModifierMessage) {
  try {
    target.postMessage(message, "*");
  } catch {
    // Cross-origin frames can refuse; nothing to do about it.
  }
}

function neighbours(): Window[] {
  const result: Window[] = [];
  if (window.parent && window.parent !== window) {
    result.push(window.parent);
  }
  const frames = document.querySelectorAll("iframe");
  frames.forEach((frame) => {
    const child = (frame as HTMLIFrameElement).contentWindow;
    if (child) {
      result.push(child);
    }
  });
  return result;
}

function broadcast(state: ModifierState, hops: number, skip?: Window) {
  const message: ModifierMessage = { type: MESSAGE_TYPE, hops, ...state };
  for (const target of neighbours()) {
    if (target !== skip) {
      post(target, message);
    }
  }
}

/** Tell the surrounding frames about a modifier change in this document. */
export function broadcastModifiers(state: ModifierState) {
  if (typeof window === "undefined") return;
  broadcast(state, 0);
}

function isModifierMessage(data: unknown): data is ModifierMessage {
  if (!data || typeof data !== "object") return false;
  const message = data as Partial<ModifierMessage>;
  return (
    message.type === MESSAGE_TYPE &&
    typeof message.altKey === "boolean" &&
    typeof message.ctrlKey === "boolean" &&
    typeof message.metaKey === "boolean" &&
    typeof message.shiftKey === "boolean" &&
    typeof message.hops === "number"
  );
}

/**
 * Listen for modifier state from other frames. Returns a cleanup function.
 */
export function listenToFrameModifiers(
  onModifiers: (state: ModifierState) => void
) {
  if (typeof window === "undefined") return () => undefined;

  const onMessage = (event: MessageEvent) => {
    if (event.source === window || !isModifierMessage(event.data)) {
      return;
    }
    const { hops, altKey, ctrlKey, metaKey, shiftKey } = event.data;
    onModifiers({ altKey, ctrlKey, metaKey, shiftKey });
    if (hops < MAX_HOPS) {
      broadcast(
        { altKey, ctrlKey, metaKey, shiftKey },
        hops + 1,
        (event.source as Window) ?? undefined
      );
    }
  };

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
