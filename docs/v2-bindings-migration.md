# Migrating editor actions to v2 bindings

LocatorJS v2 replaces the global `targetId` and `targetTemplate` options with
per-action editor targets. This is an intentional breaking change: removed
global target fields are ignored rather than translated.

Move the editor destination into each `open-editor` binding:

```ts
setup({
  bindings: [
    {
      trigger: { kind: "modifier-click", modifiers: "alt" },
      action: { kind: "open-editor", targetId: "cursor" },
    },
    {
      trigger: { kind: "hover-toolbar" },
      action: {
        kind: "open-editor",
        targetTemplate: "my-editor://open?file=${filePath}&line=${line}",
      },
    },
  ],
});
```

Each `open-editor` action may use either a configured `targetId` or its own
`targetTemplate`. Other bindings can run copy, prompt, tree, or parent actions.

The old `mouseModifiers` field remains temporarily supported as a deprecated
input. It is lazily converted to a modifier-click editor binding, but new
configuration should write `bindings` directly.
