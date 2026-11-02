/** Rebase original public assets without changing their bytes or remote URLs. */
export function assetUrl(source: string): string {
  return source.startsWith('/assets/')
    ? `${import.meta.env.BASE_URL}${source.slice(1)}`
    : source;
}
