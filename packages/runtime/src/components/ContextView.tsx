import type { Targets } from "@locator/shared";
import { ParentsMenu, type ParentRow } from "@locator/ui";
import { css } from "@locator/styled-system/css";
import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import {
  getParentsPaths,
  getParentsPathsAsync,
} from "../adapters/getParentsPath";
import type { AdapterId } from "../consts";
import { buildLink } from "../functions/buildLink";
import { useOptions } from "../functions/optionsStore";
import {
  buildParentRows,
  sourceRefToLinkProps,
} from "../functions/treeViewModel";
import type { ContextMenuState, LinkProps } from "../types/types";
import { createSourceResolutionContext } from "../adapters/react/sourceMapResolver";

const styles = {
  backdrop: css({
    bg: "black/10",
    height: "100vh",
    left: "0",
    pointerEvents: "auto",
    position: "fixed",
    top: "0",
    width: "100vw",
    zIndex: "popover",
  }),
  anchor: css({ position: "absolute" }),
};

export function ContextView(props: {
  contextMenuState: ContextMenuState;
  close: () => void;
  adapterId?: AdapterId | undefined;
  targets: Targets;
  /** Opens the link, or asks the user to pick an editor first. */
  openLink: (link: LinkProps) => void;
}) {
  const options = useOptions();
  const rows = createMemo(() =>
    buildParentRows(
      getParentsPaths(props.contextMenuState.target, props.adapterId)
    )
  );
  const [asyncRows, setAsyncRows] = createSignal<ParentRow[]>();
  const [pending, setPending] = createSignal(false);
  createEffect(() => {
    const target = props.contextMenuState.target;
    const adapter = props.adapterId;
    if (rows().length > 1 || (adapter && adapter !== "react")) return;
    const controller = new AbortController();
    setPending(true);
    void getParentsPathsAsync(
      target,
      adapter,
      createSourceResolutionContext(controller.signal)
    )
      .then((items) => {
        if (!controller.signal.aborted) setAsyncRows(buildParentRows(items));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!controller.signal.aborted) setPending(false);
      });
    onCleanup(() => controller.abort());
  });
  const displayedRows = () => asyncRows() ?? rows();

  return (
    <div
      class={styles.backdrop}
      onClick={(e) => {
        if (e.currentTarget === e.target) props.close();
      }}
    >
      <div
        class={styles.anchor}
        style={{
          top: `${props.contextMenuState.y || 0}px`,
          left: `${props.contextMenuState.x || 0}px`,
        }}
      >
        <ParentsMenu
          rows={displayedRows()}
          pending={pending()}
          autofocus
          hrefFor={(row: ParentRow) =>
            row.source
              ? buildLink(
                  sourceRefToLinkProps(row.source),
                  props.targets,
                  options
                )
              : undefined
          }
          onHover={() => {
            // Highlighting a parent needs a live node; the parents path only
            // carries source locations, so there is nothing to outline yet.
          }}
          onOpen={(row: ParentRow) => {
            if (!row.source) return;
            props.openLink(sourceRefToLinkProps(row.source));
            props.close();
          }}
          onClose={() => props.close()}
        />
      </div>
    </div>
  );
}
