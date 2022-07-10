import { createMemo } from "solid-js";
import { AdapterObject } from "./adapters/adapterApi";
import { Outline } from "./Outline";

export function MaybeOutline(props: {
  currentElement: HTMLElement;
  showTreeFromElement: (element: HTMLElement) => void;
  adapter: AdapterObject;
}) {
  const elInfo = createMemo(() =>
    props.adapter.getElementInfo(props.currentElement)
  );
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
