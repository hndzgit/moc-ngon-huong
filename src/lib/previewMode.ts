export const isFigmaPreview =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  (new URLSearchParams(window.location.search).has('figma-qa') ||
    (window.location.hash.includes('?') &&
      new URLSearchParams(window.location.hash.split('?')[1]).has('figma-qa')));
