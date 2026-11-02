import { useLayoutEffect, useRef } from 'react';

const currentHash = () => window.location.hash;

/** Hash routing: new navigation starts at top; history restores the visited position. */
export function useRouteScroll(route: string) {
  const positions = useRef(new Map<string,number>());
  const previous = useRef(currentHash());
  const navigating = useRef(false);
  const pending = useRef<number|null>(null);
  const frame = useRef(0);
  const restore = () => {
    if (pending.current === null) return;
    window.scrollTo({top:pending.current,behavior:'instant'});
    pending.current = null;
  };
  useLayoutEffect(() => {
    const native = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const onHashChange = (event:HashChangeEvent) => {
      const next = currentHash();
      // Rapid clicks can queue older hash events after the final URL has changed.
      if (new URL(event.newURL).hash !== next) return;
      if (!navigating.current) positions.current.set(previous.current,window.scrollY);
      pending.current = navigating.current ? 0 : positions.current.get(next) || 0;
      previous.current = next;
      navigating.current = false;
      if (positions.current.size > 64) positions.current.delete(positions.current.keys().next().value!);
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(restore);
    };
    window.addEventListener('hashchange',onHashChange);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener('hashchange',onHashChange);
      history.scrollRestoration = native;
    };
  },[]);
  useLayoutEffect(restore,[route]);
  return (targetHash:string) => {
    if (targetHash === currentHash()) return;
    if (!navigating.current) positions.current.set(previous.current,window.scrollY);
    navigating.current = true;
  };
}
