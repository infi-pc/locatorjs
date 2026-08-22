# Migrating editor actions to v2 bindings

LocatorJS v2 replaces the top-level `targetId` and `targetTemplate` options with
a single `editor` setting plus per-action overrides. This is an intentional
breaking change: the removed top-level fields are ignored rather than
translated.

## One editor setting

`editor` is where every source link opens — modifier-click and hover-toolbar
actions, the tree panel, the parents menu, and the welcome preview:

```ts
setup({
  editor: { targetId: "cursor" },
});
```

Use `targetTemplate` instead of `targetId` for an editor Locator does not know:

```ts
setup({
  editor: { targetTemplate: "my-editor://open?file=${filePath}&line=${line}" },
});
```

`editor` resolves atomically through the four configuration layers: a layer that
sets it replaces both fields from the layers below, so a team config cannot end
up with one layer's `targetId` and another's `targetTemplate`.

## Per-action overrides

An `open-editor` action with no target of its own follows the `editor` setting.
Give it a `targetId` or `targetTemplate` only when that one action should go
somewhere else:

```ts
setup({
  editor: { targetId: "cursor" },
  bindings: [
    // Follows the setting — opens Cursor.
    {
      trigger: { kind: "modifier-click", modifiers: "alt" },
      action: { kind: "open-editor" },
    },
    // Overrides it — always opens Zed.
    {
      trigger: { kind: "hover-toolbar" },
      action: { kind: "open-editor", targetTemplate: "zed://file/${filePath}" },
    },
  ],
});
```

In the settings UI this is the difference between an action labelled "Open in
editor" (following the setting) and one labelled "Open in Zed" (pinned). The
per-action editor picker offers "Editor setting (…)" as its first choice to hand
an action back to the global setting.

When nothing resolves — an `editor` naming a target this build does not know, for
instance — Locator asks which editor to use instead of opening a guessed link.

## Triggers and activation

Other bindings can run copy, prompt, tree, or parents actions. Holding an
activation modifier reveals the outline and its hover toolbar; the activation
combinations are derived from whatever `modifier-click` bindings exist, falling
back to `alt` when a config has only hover-toolbar actions. Deleting every
shortcut therefore still leaves the toolbar reachable.

## Deprecated input

The old `mouseModifiers` field remains temporarily supported as a deprecated
input. It is lazily converted to a modifier-click editor binding that follows the
`editor` setting, but new configuration should write `bindings` directly.
