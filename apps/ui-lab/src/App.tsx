import {
  DEFAULT_LAYER,
  allTargets,
  type Binding,
  type BindingAction,
  type LocatorLayer,
  type LocatorOptions,
  type WriteResult,
} from "@locator/shared";
import { css, cx } from "@locator/styled-system/css";
import {
  ActionSettings,
  BindingsEditor,
  Button,
  EditorPicker,
  Field,
  FoldableSection,
  IconButton,
  Kbd,
  LocatorBrand,
  ModifierChips,
  ParentsMenu,
  PromoFooter,
  ProvenanceBadge,
  SectionHeadline,
  Select,
  Spinner,
  Switch,
  Tabs,
  TextArea,
  TextInput,
  Tooltip,
  TreePanel,
  Wizard,
  actionIconFor,
  actionLabel,
  editorIconFor,
  type ParentRow,
  type TreeRow,
  type TreeViewModel,
} from "@locator/ui";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
} from "lucide-solid";
import { For, Show, createSignal, type JSX } from "solid-js";

type Provenance = "park" | "hybrid" | "local";

const provenanceLabel: Record<Provenance, string> = {
  park: "Park UI",
  hybrid: "Park / local",
  local: "Locator",
};

const styles = {
  page: css({
    bg: "bg.subtle",
    color: "fg.default",
    minH: "100vh",
  }),
  topbar: css({
    alignItems: "center",
    backdropFilter: "blur(16px)",
    bg: "bg.default/90",
    borderBottomColor: "border",
    borderBottomWidth: "1px",
    display: "flex",
    justifyContent: "space-between",
    minH: "14",
    px: { base: "4", md: "6" },
    position: "sticky",
    top: "0",
    zIndex: "sticky",
  }),
  topbarTitle: css({
    alignItems: "center",
    display: "flex",
    gap: "3",
  }),
  divider: css({ bg: "border", height: "5", width: "1px" }),
  labName: css({ color: "fg.muted", fontSize: "sm", fontWeight: "medium" }),
  version: css({ color: "fg.subtle", fontFamily: "mono", fontSize: "xs" }),
  layout: css({
    display: "grid",
    gap: { base: "0", lg: "8" },
    gridTemplateColumns: { base: "minmax(0, 1fr)", lg: "13rem minmax(0, 1fr)" },
    marginX: "auto",
    maxW: "1440px",
    px: { base: "4", md: "6" },
  }),
  sidebar: css({
    alignSelf: "start",
    display: { base: "none", lg: "flex" },
    flexDirection: "column",
    gap: "1",
    position: "sticky",
    py: "8",
    top: "14",
  }),
  sidebarLabel: css({
    color: "fg.subtle",
    fontSize: "xs",
    fontWeight: "semibold",
    letterSpacing: "wide",
    mb: "2",
    px: "2",
    textTransform: "uppercase",
  }),
  navLink: css({
    borderRadius: "l2",
    color: "fg.muted",
    fontSize: "sm",
    px: "2",
    py: "2",
    textDecoration: "none",
    _hover: { bg: "gray.subtle.bg", color: "fg.default" },
    _focusVisible: { focusVisibleRing: "outside" },
  }),
  main: css({ minW: "0", pb: "24" }),
  hero: css({
    display: "grid",
    gap: "5",
    maxW: "900px",
    pb: "10",
    pt: { base: "8", md: "12" },
  }),
  eyebrow: css({
    color: "accent.plain.fg",
    fontSize: "xs",
    fontWeight: "semibold",
    letterSpacing: "wide",
    textTransform: "uppercase",
  }),
  heroTitle: css({
    fontSize: { base: "3xl", md: "5xl" },
    fontWeight: "bold",
    letterSpacing: "tight",
    lineHeight: "1.05",
  }),
  heroCopy: css({
    color: "fg.muted",
    fontSize: { base: "md", md: "lg" },
    maxW: "700px",
  }),
  legend: css({ display: "flex", flexWrap: "wrap", gap: "2" }),
  section: css({
    borderTopColor: "border",
    borderTopWidth: "1px",
    display: "flex",
    flexDirection: "column",
    gap: "5",
    mb: "14",
    pt: "8",
    scrollMarginTop: "20",
  }),
  sectionHeader: css({
    display: "grid",
    gap: "2",
    gridTemplateColumns: {
      base: "1fr",
      md: "minmax(0, 1fr) minmax(15rem, 28rem)",
    },
  }),
  sectionTitle: css({
    fontSize: "2xl",
    fontWeight: "bold",
    letterSpacing: "tight",
  }),
  sectionCopy: css({ color: "fg.muted", fontSize: "sm", lineHeight: "1.6" }),
  grid: css({
    display: "grid",
    gap: "4",
    gridTemplateColumns: { base: "1fr", xl: "repeat(2, minmax(0, 1fr))" },
  }),
  specimen: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l3",
    borderWidth: "1px",
    display: "flex",
    flexDirection: "column",
    minW: "0",
    overflow: "hidden",
  }),
  wide: css({ gridColumn: { xl: "1 / -1" } }),
  specimenHeader: css({
    alignItems: "flex-start",
    borderBottomColor: "border",
    borderBottomWidth: "1px",
    display: "flex",
    gap: "4",
    justifyContent: "space-between",
    p: "4",
  }),
  specimenTitle: css({ fontSize: "sm", fontWeight: "semibold" }),
  specimenCopy: css({
    color: "fg.muted",
    fontSize: "xs",
    lineHeight: "1.5",
    mt: "1",
  }),
  canvas: css({
    display: "flex",
    flex: "1",
    flexDirection: "column",
    gap: "4",
    minW: "0",
    p: { base: "4", md: "5" },
  }),
  canvasMuted: css({ bg: "gray.subtle.bg" }),
  row: css({
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
  }),
  stack: css({ display: "flex", flexDirection: "column", gap: "3" }),
  callout: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    color: "fg.muted",
    fontSize: "sm",
    px: "3",
    py: "2",
  }),
  fieldGrid: css({
    display: "grid",
    gap: "4",
    gridTemplateColumns: { base: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  }),
  buttonGroup: css({ display: "flex", flexDirection: "column", gap: "2" }),
  groupLabel: css({ color: "fg.subtle", fontSize: "xs", fontWeight: "medium" }),
  palette: css({ display: "flex", flexWrap: "wrap", gap: "3" }),
  paletteItem: css({
    alignItems: "center",
    display: "flex",
    gap: "2",
    minW: "28",
  }),
  iconTile: css({
    alignItems: "center",
    bg: "gray.subtle.bg",
    borderRadius: "l2",
    display: "inline-flex",
    height: "8",
    justifyContent: "center",
    width: "8",
  }),
  muted: css({ color: "fg.muted", fontSize: "xs" }),
  frameWrap: css({
    alignItems: "flex-start",
    bg: "gray.subtle.bg",
    display: "flex",
    justifyContent: "center",
    overflowX: "auto",
    p: { base: "3", md: "8" },
  }),
  popupFrame: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l3",
    borderWidth: "1px",
    boxShadow: "xl",
    flex: "0 0 auto",
    maxW: "100%",
    p: "3",
    width: "450px",
  }),
  panelFrame: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l3",
    borderWidth: "1px",
    boxShadow: "xl",
    flex: "0 0 auto",
    maxW: "100%",
    p: "4",
    width: "640px",
  }),
  provenance: css({
    alignItems: "center",
    borderRadius: "full",
    display: "inline-flex",
    fontSize: "xs",
    fontWeight: "medium",
    gap: "1.5",
    px: "2",
    py: "1",
  }),
  provenanceDot: css({ borderRadius: "full", height: "1.5", width: "1.5" }),
  park: css({ bg: "blue.subtle.bg", color: "blue.subtle.fg" }),
  hybrid: css({ bg: "amber.subtle.bg", color: "amber.subtle.fg" }),
  local: css({ bg: "teal.subtle.bg", color: "teal.subtle.fg" }),
  parkDot: css({ bg: "blue.solid.bg" }),
  hybridDot: css({ bg: "amber.solid.bg" }),
  localDot: css({ bg: "teal.solid.bg" }),
};

const navItems = [
  ["foundations", "Foundations"],
  ["controls", "Controls"],
  ["composites", "Composites"],
  ["panels", "Inspector panels"],
  ["settings", "Settings surface"],
  ["flows", "Flows"],
] as const;

/**
 * Stands in for what the runtime maps out of an adapter: a component boundary
 * above the element it renders, rows with and without a source, and one nested
 * level so indent guides and chevrons are visible.
 */
const treeRows: TreeRow[] = [
  {
    id: "c:app",
    kind: "component",
    label: "App",
    source: { filePath: "/repo/src/main.tsx", line: 12, column: 3 },
    detail: "main.tsx:12",
    hasChildren: true,
    children: [
      {
        id: "e:main",
        kind: "element",
        label: "main",
        source: { filePath: "/repo/src/App.tsx", line: 24, column: 5 },
        detail: "App.tsx:24",
        hasChildren: true,
        children: [
          {
            id: "c:nesting",
            kind: "component",
            label: "NestingTest",
            source: { filePath: "/repo/src/App.tsx", line: 31, column: 7 },
            detail: "App.tsx:31",
            hasChildren: true,
            children: [
              {
                id: "e:section",
                kind: "element",
                label: "section",
                source: {
                  filePath: "/repo/src/NestingTest.tsx",
                  line: 16,
                  column: 5,
                },
                detail: "NestingTest.tsx:16",
                hasChildren: true,
                children: [
                  {
                    id: "e:button",
                    kind: "element",
                    label: "button",
                    source: {
                      filePath: "/repo/src/NestingTest.tsx",
                      line: 18,
                      column: 9,
                    },
                    detail: "NestingTest.tsx:18",
                    hasChildren: false,
                    children: [],
                  },
                  {
                    // No source: injected by a library, so the row is inert.
                    id: "e:svg",
                    kind: "element",
                    label: "svg",
                    source: null,
                    hasChildren: false,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const treeModel: TreeViewModel = {
  rows: treeRows,
  selectedId: "e:button",
  canGoUp: true,
};

const parentRows: ParentRow[] = [
  {
    id: "p0",
    component: "NestingTest",
    tag: "button",
    detail: "NestingTest.tsx:18:9",
    kind: "call-site",
    source: { filePath: "/repo/src/NestingTest.tsx", line: 18, column: 9 },
  },
  {
    id: "p1",
    component: "App",
    tag: "NestingTest",
    detail: "App.tsx:31:7",
    kind: "call-site",
    source: { filePath: "/repo/src/App.tsx", line: 31, column: 7 },
  },
  {
    id: "p2",
    component: "App",
    detail: "App.tsx:8:1",
    kind: "declaration",
    source: { filePath: "/repo/src/App.tsx", line: 8, column: 1 },
  },
];

const actionSamples: BindingAction[] = [
  { kind: "open-editor", targetId: "vscode" },
  { kind: "copy-path" },
  { kind: "copy-prompt" },
  { kind: "open-prompt", app: "cursor" },
  { kind: "show-tree" },
  { kind: "show-parents" },
];

const sampleBindings: Binding[] = [
  {
    trigger: { kind: "modifier-click", modifiers: "alt" },
    action: { kind: "open-editor", targetId: "cursor" },
  },
  {
    trigger: { kind: "modifier-click", modifiers: "meta+shift" },
    action: { kind: "copy-prompt" },
  },
  { trigger: { kind: "hover-toolbar" }, action: { kind: "show-tree" } },
  { trigger: { kind: "hover-toolbar" }, action: { kind: "copy-path" } },
];

const editorSelectItems = Object.entries(allTargets)
  .slice(0, 5)
  .map(([value, target]) => ({ value, label: target.label }));

const initialLayers: Partial<Record<LocatorLayer, LocatorOptions>> = {
  default: DEFAULT_LAYER,
  team: {
    projectPath: "/workspace/locatorjs/",
    hrefTarget: "_blank",
  },
  "user-extension": {
    bindings: sampleBindings,
    debugMode: false,
  },
  "user-origin": {},
};

export function App() {
  const [switchOn, setSwitchOn] = createSignal(true);
  const [selectValue, setSelectValue] = createSignal("cursor");
  const [plainSelectValue, setPlainSelectValue] = createSignal("vscode");
  const [ghostScope, setGhostScope] = createSignal("site");
  const [pickedEditor, setPickedEditor] = createSignal<string>();
  const [modifiers, setModifiers] = createSignal<string | undefined>(
    "alt+shift"
  );
  const [editor, setEditor] = createSignal<{
    targetId?: string;
    targetTemplate?: string;
  }>({ targetId: "vscode" });
  const [bindings, setBindings] = createSignal<Binding[]>(sampleBindings);
  const [layers, setLayers] = createSignal(initialLayers);
  const [wizardStep, setWizardStep] = createSignal("choose");
  const [finished, setFinished] = createSignal(false);
  const [expandedIds, setExpandedIds] = createSignal<ReadonlySet<string>>(
    new Set(["c:app", "e:main", "c:nesting", "e:section"])
  );
  const [opened, setOpened] = createSignal<string>();

  const toggleExpanded = (id: string) =>
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // The lab has no storage behind it, so every write trivially succeeds.
  const updateEditor = (next: {
    targetId?: string;
    targetTemplate?: string;
  }): WriteResult => {
    setEditor(next);
    return { ok: true };
  };

  const writeLayer =
    (layer: LocatorLayer) =>
    async (patch: Partial<LocatorOptions>): Promise<WriteResult> => {
      setLayers((current) => ({
        ...current,
        [layer]: { ...current[layer], ...patch },
      }));
      return { ok: true };
    };

  return (
    <div class={styles.page}>
      <header class={styles.topbar}>
        <div class={styles.topbarTitle}>
          <LocatorBrand />
          <span class={styles.divider} />
          <span class={styles.labName}>UI Lab</span>
        </div>
        <span class={styles.version}>@locator/ui · live source</span>
      </header>

      <div class={styles.layout}>
        <aside class={styles.sidebar} aria-label="Component lab sections">
          <div class={styles.sidebarLabel}>Inventory</div>
          <For each={navItems}>
            {([id, label]) => (
              <a class={styles.navLink} href={`#${id}`}>
                {label}
              </a>
            )}
          </For>
        </aside>

        <main class={styles.main}>
          <div class={styles.hero}>
            <div class={styles.eyebrow}>Component inventory</div>
            <h1 class={styles.heroTitle}>One place to see the real UI.</h1>
            <p class={styles.heroCopy}>
              Every specimen imports the production Solid components and shared
              Panda theme. Use this page to compare states, expose drift, and
              clean the system without relying on screenshots of the extension.
            </p>
            <div class={styles.legend} aria-label="Component provenance legend">
              <ProvenanceTag kind="park" />
              <ProvenanceTag kind="hybrid" />
              <ProvenanceTag kind="local" />
            </div>
          </div>

          <LabSection
            id="foundations"
            title="Foundations"
            description="Brand, type, icons, status, and provenance elements used across popup, runtime, and onboarding surfaces."
          >
            <Specimen
              title="Identity & status"
              description="Small shared elements without business state."
              provenance="hybrid"
            >
              <div class={styles.stack}>
                <div class={styles.row}>
                  <LocatorBrand />
                  <span class={styles.divider} />
                  <SectionHeadline>Section headline</SectionHeadline>
                </div>
                <div class={styles.row}>
                  <Kbd>⌥</Kbd>
                  <Kbd>⇧</Kbd>
                  <Kbd>Click</Kbd>
                  <Spinner />
                  <span class={styles.muted}>Loading component data…</span>
                </div>
              </div>
            </Specimen>

            <Specimen
              title="Configuration provenance"
              description="Locator-specific badges on Park’s badge recipe."
              provenance="hybrid"
            >
              <div class={styles.row}>
                <ProvenanceBadge layer="default" />
                <ProvenanceBadge layer="team" />
                <ProvenanceBadge layer="user-extension" />
                <ProvenanceBadge layer="user-origin" />
              </div>
            </Specimen>

            <Specimen
              title="Editor icons"
              description="Bundled brand marks and the custom-link fallback."
              provenance="local"
            >
              <div class={styles.palette}>
                <For
                  each={[
                    "vscode",
                    "cursor",
                    "webstorm",
                    "windsurf",
                    "zed",
                    "nvim",
                    "custom",
                  ]}
                >
                  {(id) => (
                    <div class={styles.paletteItem}>
                      <span class={styles.iconTile}>{editorIconFor(id)}</span>
                      <span class={styles.muted}>{id}</span>
                    </div>
                  )}
                </For>
              </div>
            </Specimen>

            <Specimen
              title="Action icons"
              description="The complete binding-action vocabulary."
              provenance="local"
            >
              <div class={styles.palette}>
                <For each={actionSamples}>
                  {(action) => (
                    <div class={styles.paletteItem}>
                      <span class={styles.iconTile}>
                        {actionIconFor(action, allTargets)}
                      </span>
                      <span class={styles.muted}>
                        {actionLabel(action, allTargets)}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </Specimen>
          </LabSection>

          <LabSection
            id="controls"
            title="Controls"
            description="The primitive layer. These are the best candidates for replacing ad-hoc implementations with upstream-shaped Park components."
          >
            <Specimen
              title="Buttons"
              description="Locator variant names mapped onto the Park button recipe."
              provenance="hybrid"
              wide
            >
              <div class={styles.fieldGrid}>
                <div class={styles.buttonGroup}>
                  <span class={styles.groupLabel}>Variants</span>
                  <div class={styles.row}>
                    <Button variant="primary">Primary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="danger-ghost">
                      <Trash2 size={16} /> Danger
                    </Button>
                    <Button disabled>Disabled</Button>
                  </div>
                </div>
                <div class={styles.buttonGroup}>
                  <span class={styles.groupLabel}>Sizes & icons</span>
                  <div class={styles.row}>
                    <Button size="xs">
                      <Plus size={14} /> Extra small
                    </Button>
                    <Button size="sm">
                      <Copy size={16} /> Small
                    </Button>
                    <Button size="md">
                      <ArrowRight size={18} /> Medium
                    </Button>
                    <Tooltip label="Reset setting">
                      <IconButton aria-label="Reset setting">
                        <RotateCcw size={16} />
                      </IconButton>
                    </Tooltip>
                    <IconButton aria-label="Open settings" variant="outline">
                      <Settings2 size={16} />
                    </IconButton>
                  </div>
                </div>
              </div>
            </Specimen>

            <Specimen
              title="Text fields"
              description="Recipe-backed input plus a fully local textarea."
              provenance="hybrid"
              wide
            >
              <div class={styles.fieldGrid}>
                <Field
                  label="Project path"
                  helper="Used to resolve source links."
                >
                  <TextInput value="/Users/me/project/" />
                </Field>
                <Field label="Tmux session" error="Session could not be found.">
                  <TextInput aria-invalid="true" value="frontend" />
                </Field>
                <Field label="Custom link" helper="Monospace presentation.">
                  <TextInput mono value="editor://file/${filePath}:${line}" />
                </Field>
                <Field
                  label="Prompt template"
                  helper="Textarea is locally styled."
                >
                  <TextArea value="Update ${componentName} in ${filePath}." />
                </Field>
              </div>
            </Specimen>

            <Specimen
              title="Select"
              description="Ark UI behavior with a local composition and button styling. Outline and ghost variants, sm and xs sizes, placeholder, and per-item disabled with a tooltip."
              provenance="hybrid"
              wide
            >
              <div class={styles.stack}>
                <div class={styles.fieldGrid}>
                  <div class={styles.buttonGroup}>
                    <span class={styles.groupLabel}>Outline · with icons</span>
                    <Select
                      aria-label="Editor example"
                      items={editorSelectItems.map((item) => ({
                        ...item,
                        icon: () => editorIconFor(item.value),
                      }))}
                      value={selectValue()}
                      onChange={setSelectValue}
                    />
                  </div>
                  <div class={styles.buttonGroup}>
                    <span class={styles.groupLabel}>
                      Outline · no icons · sm and xs
                    </span>
                    <Select
                      aria-label="Editor example without icons"
                      items={editorSelectItems}
                      value={plainSelectValue()}
                      onChange={setPlainSelectValue}
                    />
                    <Select
                      aria-label="Extra small editor example"
                      size="xs"
                      items={editorSelectItems}
                      value={plainSelectValue()}
                      onChange={setPlainSelectValue}
                    />
                  </div>
                  <div class={styles.buttonGroup}>
                    <span class={styles.groupLabel}>
                      Ghost · xs · disabled item with tooltip
                    </span>
                    <div class={styles.row}>
                      <Select
                        aria-label="Scope example"
                        variant="ghost"
                        size="xs"
                        items={[
                          { value: "site", label: "This site" },
                          { value: "all", label: "All sites" },
                          {
                            value: "page",
                            label: "This page",
                            disabled: true,
                            title: "Connect to a page to configure it.",
                          },
                        ]}
                        value={ghostScope()}
                        onChange={setGhostScope}
                      />
                    </div>
                  </div>
                  <div class={styles.buttonGroup}>
                    <span class={styles.groupLabel}>
                      Placeholder · disabled control
                    </span>
                    <Select
                      aria-label="Pick an editor"
                      placeholder="Choose editor…"
                      items={editorSelectItems}
                      value={pickedEditor()}
                      onChange={setPickedEditor}
                    />
                    <Select
                      aria-label="Disabled editor example"
                      disabled
                      items={editorSelectItems}
                      value="vscode"
                      onChange={() => undefined}
                    />
                  </div>
                </div>
                <span class={styles.muted}>
                  Selected: {selectValue()} · plain: {plainSelectValue()} ·
                  scope: {ghostScope()} · placeholder: {pickedEditor() ?? "—"}
                </span>
              </div>
            </Specimen>

            <Specimen
              title="Switch"
              description="Boolean input composed from the near-stock Park UI switch."
              provenance="park"
            >
              <Switch
                checked={switchOn()}
                onChange={setSwitchOn}
                label="Open links in a new tab"
              >
                Open links in a new tab · {switchOn() ? "On" : "Off"}
              </Switch>
            </Specimen>

            <Specimen
              title="Modifier chips"
              description="Locator-specific shortcut controls. Compact pills fit dense settings; full keycaps mirror physical Mac and Windows keyboards."
              provenance="local"
              wide
            >
              <div class={styles.stack}>
                <div class={styles.buttonGroup}>
                  <span class={styles.groupLabel}>
                    Compact · current platform
                  </span>
                  <ModifierChips value={modifiers()} onChange={setModifiers} />
                </div>
                <div class={styles.fieldGrid}>
                  <div class={styles.buttonGroup}>
                    <span class={styles.groupLabel}>Full · macOS</span>
                    <ModifierChips
                      variant="full"
                      platform="mac"
                      value={modifiers()}
                      onChange={setModifiers}
                    />
                  </div>
                  <div class={styles.buttonGroup}>
                    <span class={styles.groupLabel}>Full · Windows</span>
                    <ModifierChips
                      variant="full"
                      platform="windows"
                      value={modifiers()}
                      onChange={setModifiers}
                    />
                  </div>
                </div>
                <span class={styles.muted}>Value: {modifiers() || "None"}</span>
              </div>
            </Specimen>

            <Specimen
              title="Tabs"
              description="Park/Ark tabs with the local connected variant. Kept as an available primitive; no production consumer since the scope switch moved to the ghost Select."
              provenance="park"
              wide
            >
              <Tabs
                ariaLabel="Lab tabs"
                defaultId="first"
                items={[
                  {
                    id: "first",
                    label: "Overview",
                    content: (
                      <p class={styles.muted}>
                        Connected tab content using the production wrapper.
                      </p>
                    ),
                  },
                  {
                    id: "second",
                    label: "Settings",
                    content: (
                      <p class={styles.muted}>A second panel for comparison.</p>
                    ),
                  },
                  {
                    id: "disabled",
                    label: "Unavailable",
                    disabled: true,
                    disabledReason: "Requires a connected LocatorJS page.",
                    content: <span />,
                  },
                ]}
              />
            </Specimen>

            <Specimen
              title="Foldable section"
              description="Native details/summary card, closed by default with a rotating chevron; keyboard accessible for free. Advanced settings uses it for Diagnostics and Configuration sources."
              provenance="local"
            >
              <div class={styles.stack}>
                <FoldableSection title="Diagnostics">
                  <p class={styles.muted}>
                    Rarely needed toggles collapse out of the way by default.
                  </p>
                </FoldableSection>
                <FoldableSection title="Configuration sources">
                  <p class={styles.muted}>
                    Later sources override earlier ones for each setting.
                  </p>
                </FoldableSection>
              </div>
            </Specimen>
          </LabSection>

          <LabSection
            id="composites"
            title="Composites"
            description="Reusable pieces that express Locator concepts and should remain product-owned while consuming standardized controls."
          >
            <Specimen
              title="Editor picker"
              description="Named editors, custom templates, editing, and tooltip behavior."
              provenance="local"
            >
              <EditorPicker
                targets={allTargets}
                targetId={editor().targetId}
                targetTemplate={editor().targetTemplate}
                onChange={updateEditor}
              />
            </Specimen>

            <Specimen
              title="Promo footer"
              description="Compact contextual calls to action."
              provenance="local"
            >
              <PromoFooter
                promos={[
                  {
                    text: "Keep these settings on every site.",
                    href: "#composites",
                    linkLabel: "Install the extension",
                  },
                  {
                    text: "Share defaults with your team.",
                    href: "#settings",
                    linkLabel: "Read setup docs",
                  },
                ]}
              />
            </Specimen>

            <Specimen
              title="Bindings editor"
              description="The onboarding-oriented editor with full draft flows."
              provenance="local"
              wide
            >
              <BindingsEditor
                value={bindings()}
                targets={allTargets}
                onChange={(next) => {
                  setBindings(next ?? []);
                  return { ok: true };
                }}
              />
            </Specimen>
          </LabSection>

          <LabSection
            id="panels"
            title="Inspector panels"
            description="The two panels the in-page runtime opens from the hover toolbar. Both take a view model and callbacks only, so what you see here is exactly what the runtime renders. Click a row to see what it resolves to; rows without a source are inert on purpose."
          >
            <Specimen
              title="Tree panel"
              description="Component boundaries, element rows, indent guides, and keyboard navigation (↑↓ move, ←→ collapse/expand, Enter opens, Esc closes)."
              provenance="local"
              mutedCanvas
            >
              <TreePanel
                model={treeModel}
                expandedIds={expandedIds()}
                hint="↑↓ move · ←→ collapse/expand · Enter opens · Esc closes"
                onToggle={toggleExpanded}
                onGoUp={() => setOpened("Show parent")}
                onHover={() => undefined}
                onOpen={(row) =>
                  setOpened(`${row.source!.filePath}:${row.source!.line}`)
                }
                onClose={() => setOpened("Closed")}
              />
            </Specimen>

            <Specimen
              title="Parents menu"
              description="Ancestors labelled with the component that renders them, each with its own file:line so two entries in the same file are told apart."
              provenance="local"
              mutedCanvas
            >
              <ParentsMenu
                rows={parentRows}
                onHover={() => undefined}
                onOpen={(row) =>
                  setOpened(`${row.source!.filePath}:${row.source!.line}`)
                }
                onClose={() => setOpened("Closed")}
              />
            </Specimen>

            <Specimen
              title="Empty states"
              description="What both panels show when the adapter resolved nothing worth opening."
              provenance="local"
              mutedCanvas
            >
              <div class={styles.stack}>
                <TreePanel
                  model={{ rows: [], canGoUp: false }}
                  expandedIds={new Set()}
                  onToggle={() => undefined}
                  onGoUp={() => undefined}
                  onHover={() => undefined}
                  onOpen={() => undefined}
                  onClose={() => undefined}
                />
                <ParentsMenu
                  rows={[]}
                  onHover={() => undefined}
                  onOpen={() => undefined}
                  onClose={() => undefined}
                />
              </div>
            </Specimen>

            <Show when={opened()}>
              <div class={styles.callout} role="status">
                Last action: <code>{opened()}</code>
              </div>
            </Show>
          </LabSection>

          <LabSection
            id="settings"
            title="Settings surface"
            description="The same ActionSettings component used by the extension popup and the in-page runtime panel. Add, edit, inherit, and open Advanced to exercise all states."
          >
            <Specimen
              title="Extension popup"
              description="Production width with This site and All sites scopes."
              provenance="local"
              wide
              mutedCanvas
            >
              <div class={styles.frameWrap}>
                <div class={styles.popupFrame}>
                  <ActionSettings
                    layers={layers()}
                    targets={allTargets}
                    scopes={[
                      {
                        layer: "user-origin",
                        label: "This site",
                        write: writeLayer("user-origin"),
                      },
                      {
                        layer: "user-extension",
                        label: "All sites",
                        write: writeLayer("user-extension"),
                      },
                    ]}
                    defaultScope="user-origin"
                    onTryAction={() => undefined}
                    advancedExtras={
                      <PromoFooter
                        promos={[
                          {
                            text: "Share Locator defaults with your team.",
                            href: "#settings",
                            linkLabel: "Set up Locator via setup()",
                          },
                        ]}
                      />
                    }
                  />
                </div>
              </div>
            </Specimen>
          </LabSection>

          <LabSection
            id="flows"
            title="Flows"
            description="Large composed surfaces are included to reveal typography, spacing, and control inconsistencies across complete journeys."
          >
            <Specimen
              title="Setup wizard"
              description="Shared page-sized wizard shell with live navigation."
              provenance="local"
              wide
              mutedCanvas
            >
              <div class={styles.frameWrap}>
                <div class={styles.panelFrame}>
                  <Show
                    when={!finished()}
                    fallback={
                      <div class={styles.stack}>
                        <span class={styles.iconTile}>
                          <Check size={18} />
                        </span>
                        <SectionHeadline>Setup complete</SectionHeadline>
                        <p class={styles.muted}>
                          The wizard can be restarted without reloading the lab.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFinished(false);
                            setWizardStep("choose");
                          }}
                        >
                          Restart wizard
                        </Button>
                      </div>
                    }
                  >
                    <Wizard
                      size="page"
                      activeId={wizardStep()}
                      onStepChange={setWizardStep}
                      onFinish={() => setFinished(true)}
                      onSkip={() => setFinished(true)}
                      finishLabel="Open Locator"
                      steps={[
                        {
                          id: "choose",
                          title: "Choose your editor",
                          description:
                            "Pick where LocatorJS should open source files.",
                          content: (
                            <EditorPicker
                              targets={allTargets}
                              targetId={editor().targetId}
                              targetTemplate={editor().targetTemplate}
                              onChange={updateEditor}
                            />
                          ),
                        },
                        {
                          id: "actions",
                          title: "Set up actions",
                          description:
                            "Choose what modifier clicks and toolbar buttons do.",
                          content: (
                            <BindingsEditor
                              value={bindings()}
                              targets={allTargets}
                              onChange={(next) => {
                                setBindings(next ?? []);
                                return { ok: true };
                              }}
                            />
                          ),
                        },
                        {
                          id: "ready",
                          title: "You’re ready",
                          description:
                            "Try LocatorJS on a component in your app.",
                          content: (
                            <div class={styles.stack}>
                              <SectionHeadline>
                                Everything is connected.
                              </SectionHeadline>
                              <p class={styles.muted}>
                                Hold <Kbd>⌥</Kbd> and click a component to open
                                it in your editor.
                              </p>
                              <Button variant="primary">
                                <ExternalLink size={16} /> Try Locator
                              </Button>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </Show>
                </div>
              </div>
            </Specimen>
          </LabSection>
        </main>
      </div>
    </div>
  );
}

function LabSection(props: {
  id: string;
  title: string;
  description: string;
  children: JSX.Element;
}) {
  return (
    <section id={props.id} class={styles.section}>
      <div class={styles.sectionHeader}>
        <h2 class={styles.sectionTitle}>{props.title}</h2>
        <p class={styles.sectionCopy}>{props.description}</p>
      </div>
      <div class={styles.grid}>{props.children}</div>
    </section>
  );
}

function Specimen(props: {
  title: string;
  description: string;
  provenance: Provenance;
  children: JSX.Element;
  wide?: boolean;
  mutedCanvas?: boolean;
}) {
  return (
    <article class={cx(styles.specimen, props.wide && styles.wide)}>
      <header class={styles.specimenHeader}>
        <div>
          <h3 class={styles.specimenTitle}>{props.title}</h3>
          <p class={styles.specimenCopy}>{props.description}</p>
        </div>
        <ProvenanceTag kind={props.provenance} />
      </header>
      <div class={cx(styles.canvas, props.mutedCanvas && styles.canvasMuted)}>
        {props.children}
      </div>
    </article>
  );
}

function ProvenanceTag(props: { kind: Provenance }) {
  return (
    <span class={cx(styles.provenance, styles[props.kind])}>
      <span class={cx(styles.provenanceDot, styles[`${props.kind}Dot`])} />
      {provenanceLabel[props.kind]}
    </span>
  );
}
