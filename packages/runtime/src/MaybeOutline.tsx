import { createMemo } from "solid-js";
import { getElementInfo } from "./adapters/react/reactAdapter";
import { Outline } from "./Outline";

export function MaybeOutline(props: {
  currentElement: HTMLElement;
  showTreeFromElement: (element: HTMLElement) => void;
}) {
  const elInfo = createMemo(() => getElementInfo(props.currentElement));
  return (
    <>
      {elInfo() ? (
        <Outline
          element={elInfo()!}
          showTreeFromElement={props.showTreeFromElement}
        />
      ) : null}
    </>
  );
}
