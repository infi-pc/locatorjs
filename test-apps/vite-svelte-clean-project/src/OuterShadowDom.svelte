<script>
  import { onMount, onDestroy } from "svelte";
  import InnerShadowDom from "./InnerShadowDom.svelte";

  let shadowRoot = null;

  onMount(() => {
    const hostElement = document.querySelector("#my-shadow-component");
    shadowRoot = hostElement.attachShadow({ mode: "open" });

    const innerComponent = new InnerShadowDom({
      target: shadowRoot,
    });

    // Clean up when the component is destroyed
    onDestroy(() => {
      innerComponent.$destroy();
    });
  });
</script>

<div id="my-shadow-component" />
