// Visual-only success states are available solely in the local Figma QA build.
export const isFigmaPreview = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).has('figma-qa');
