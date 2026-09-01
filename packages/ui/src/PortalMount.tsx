import { createContext, useContext, type JSX } from "solid-js";

const PortalMountContext = createContext<Node>();

export function PortalMountProvider(props: {
  mount: Node;
  children: JSX.Element;
}) {
  return (
    <PortalMountContext.Provider value={props.mount}>
      {props.children}
    </PortalMountContext.Provider>
  );
}

/** The nearest overlay host, or the document body outside a provider. */
export function usePortalMount(explicit?: () => Node | undefined): () => Node {
  const contextual = useContext(PortalMountContext);
  return () => explicit?.() ?? contextual ?? document.body;
}
