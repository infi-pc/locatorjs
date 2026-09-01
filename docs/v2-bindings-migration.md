# Migrating configuration to LocatorJS v2

LocatorJS v2 uses one strict configuration shape at every public boundary.
Configuration is parsed before it reaches the runtime, and an invalid `setup()`
call applies nothing: it returns `{ ok: false, errors }` and reports every
error to the console, from both the browser and the server entry point. A later
`setup()` call is unaffected by an earlier rejected one, so whatever
configuration was already accepted stays active — but if you install LocatorJS
as a library and the rejected call was the only one, the runtime never starts.
(The browser extension starts on its own and is unaffected.)

`setup()` returned `void` in v1. Check the result if you want to handle the
failure yourself:

```ts
const result = setup({ projectPath: "/src" });
if (!result.ok) {
  // result.errors: { path, code, message }[]
}
```

## One editor destination

`editor` is a tagged choice. A known editor uses `kind: "target"`:

```ts
const result = setup({
  editor: { kind: "target", id: "cursor" },
});
```

A custom link uses `kind: "template"`:

```ts
setup({
  editor: {
    kind: "template",
    template: "my-editor://open?file=${filePath}&line=${line}",
  },
});
```

These alternatives cannot be combined. The selected destination applies to
modifier-click actions, tree and parents links, and link previews.

## Per-action destinations

An `open-editor` action with no `destination` inherits the `editor` setting.
Add a destination only when that action must open somewhere else:

```ts
setup({
  editor: { kind: "target", id: "cursor" },
  bindings: [
    {
      trigger: { kind: "modifier-click", modifiers: ["alt"] },
      action: { kind: "open-editor" },
    },
    {
      trigger: { kind: "hover-toolbar" },
      action: {
        kind: "open-editor",
        destination: {
          kind: "template",
          template: "zed://file/${filePath}",
        },
      },
    },
  ],
});
```

Modifier chords are non-empty arrays, not `"+"`-joined strings. Duplicate
modifiers, duplicate shortcuts, duplicate toolbar actions, unsafe templates,
and more than six actions in either trigger group are rejected at setup.

If a stored target no longer exists, the runtime enters an explicit
`needs-selection` state and asks the user to choose an editor. It never guesses
a destination.

## Custom target maps

Supplying `targets` replaces the built-in registry. If `editor` is omitted,
the first target becomes the app's team-level selection:

```ts
setup({
  targets: {
    github: {
      label: "GitHub",
      url: "https://github.com/acme/repo/blob/main${filePath}#L${line}",
    },
    githubDev: {
      label: "GitHub.dev",
      url: "https://github.dev/acme/repo/blob/main${filePath}#L${line}",
    },
  },
  editor: { kind: "target", id: "githubDev" },
});
```

The explicit `editor` must name an entry in the supplied registry.

## Removed preview fields

The unreleased v2 preview fields are not accepted:

- `mouseModifiers`
- editor objects with optional `targetId` or `targetTemplate`
- per-action `targetId` or `targetTemplate`
- `"+"`-joined modifier strings

Released v1 site and extension storage is migrated once, field by field, into
the versioned v3 envelope. Unversioned or preview-v2 storage is reported as
`reset-required`; it is not guessed into the new model.
