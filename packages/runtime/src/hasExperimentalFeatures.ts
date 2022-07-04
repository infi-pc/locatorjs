export let hasExperimentalFeatures = () =>
  document.documentElement.dataset.locatorExperimentalFeatures || false;
