# Iframes and shadow DOM

How Locator behaves when the component you click is not in the main document
tree, and what it cannot do.

## Shadow DOM

Locator listens on `document` only. Mouse and keyboard events from open shadow
trees are composed, so they reach that listener; the browser retargets
`event.target` to the shadow host, and
[`resolveEventTarget`](../packages/runtime/src/functions/resolveEventTarget.ts)
recovers the real element from `event.composedPath()`.

Supported:

| Case                                                    | Works | Notes                                                                                                              |
| ------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| Element in an open shadow root                          | yes   | Any depth, including shadow roots inside shadow roots.                                                             |
| Shadow root attached after Locator loaded               | yes   | Nothing is captured at load time.                                                                                  |
| Shadow host itself                                      | yes   | Resolves the host's own source.                                                                                    |
| Slotted light-DOM children                              | yes   | The element lives in the document, so nothing special.                                                             |
| Custom elements with a shadow root                      | yes   | Falls back to the host's source when the inner markup is static.                                                   |
| Element in a closed shadow root                         | yes\* | See below.                                                                                                         |
| Source lookup for a component rendered in a shadow root | yes   | Parent lookup steps out through the host, see [`domTraversal`](../packages/runtime/src/functions/domTraversal.ts). |
| Pointer cursor over shadow content                      | yes   | The page-level rule cannot cross the boundary, so the rule is pushed into each root.                               |

\* Closed roots hide themselves: `host.shadowRoot` is `null` and the composed
path stops at the host. The extension's small MAIN-world hook patches
`Element.prototype.attachShadow` at `document_start` and records roots in the
shared [`shadowRootRegistry`](../packages/shared/src/shadowRootRegistry.ts).
The runtime then finds the element under the pointer with
`ShadowRoot.elementFromPoint`. A closed root attached before that hook executes
cannot be tracked; clicks on it resolve the host instead of the inner element.

## Iframes

Each document runs its own Locator runtime, draws its own overlay, and resolves
sources against its own bundle. There is no single overlay spanning the frame
tree, so the overlay of a child frame is clipped to that frame's viewport.

### Browser extension

The content script declares `all_frames`, so every frame in the tab - including
cross-origin ones - gets the hook and the client. `match_origin_as_fallback`
covers `srcdoc`, `about:blank` and `data:` frames. Same-origin and inherited-
origin frames receive the complete extension settings. Cross-origin frames get
a safe projection that omits editor, prompt and path configuration; actions
that need the withheld editor explain that they are unavailable there instead
of opening a setup wizard that could only write to the third party's origin.
The popup talks to frame 0 only, so the settings it shows are always the top
document's.

### Library setup

`setupLocatorUI()` has to be called in each document that should be
clickable. For a same-origin iframe that means the child's own entry point calls
it; a child that does not is still clickable from the parent, but the parent can
only resolve the `<iframe>` element itself.

### Modifier keys across frames

Keyboard events only reach the focused document. With the pointer resting inside
an iframe and the modifier pressed afterwards, the child would never learn the
key went down. Each runtime therefore broadcasts its own modifier state to its
parent and child frames and forwards what it receives one hop further - see
[`crossFrameModifiers`](../packages/runtime/src/functions/crossFrameModifiers.ts).
Only the four modifier booleans cross the boundary, which is why this is safe to
accept from cross-origin frames.

Leaving a document clears its highlight, so the parent does not keep a stale
outline behind an iframe the pointer moved into.

### Known limits

- A child frame's overlay, context menu and tree view cannot escape the frame's
  own viewport.
- Cross-origin children need their own runtime; the parent cannot inject one.
- Source resolution is per document. A component rendered by the parent into a
  child frame's document resolves against the child's `__LOCATOR_DATA__`.

## Tests

- Scenario pages: `test-apps/vite-react-project/embedding.html` (plus
  `iframe-child.html` and `iframe-child-bare.html`).
- End to end: `apps/playwright/tests/libs/embedding.spec.ts`.
- Unit: `shadowRoots.test.ts`, `resolveEventTarget.test.ts`,
  `domTraversal.test.ts`, `crossFrameModifiers.test.ts`,
  `isLocatorsOwnElement.test.ts` in `packages/runtime/src/functions`.
