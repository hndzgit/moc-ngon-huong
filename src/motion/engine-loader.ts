import type { gsap } from 'gsap';

export let motionEngine: typeof gsap | undefined;
type Ready = (engine: typeof gsap) => void;
const listeners = new Set<Ready>();
let loading: Promise<void> | undefined;

export function loadMotionEngine() {
  return loading ||= import('gsap').then(module => {
    motionEngine = module.gsap;
    listeners.forEach(ready => ready(motionEngine!));
    listeners.clear();
  }).catch(error => {
    // Content and native CSS controls remain usable if the optional chunk fails.
    console.warn('Motion enhancement unavailable; keeping the static interface.', error);
  });
}

export function whenMotionReady(ready: Ready) {
  if (motionEngine) ready(motionEngine);
  else listeners.add(ready);
  return () => { listeners.delete(ready); };
}

/** Load after the initial page has painted. Reduced motion needs no GSAP download. */
export function warmMotionEngine() {
  const preference = window.matchMedia('(prefers-reduced-motion: no-preference)');
  let timer = 0;
  let idle = 0;
  const queue = () => {
    clearTimeout(timer);
    if (idle) window.cancelIdleCallback(idle);
    if (!preference.matches || loading) return;
    timer = window.setTimeout(() => {
      if (!preference.matches) return;
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(() => { if(preference.matches)void loadMotionEngine(); }, {timeout:1000});
      else void loadMotionEngine();
    }, 200);
  };
  if (document.readyState === 'complete') queue();
  else window.addEventListener('load', queue, {once:true});
  preference.addEventListener('change', queue);
  return () => {
    clearTimeout(timer);
    if (idle) window.cancelIdleCallback(idle);
    window.removeEventListener('load', queue);
    preference.removeEventListener('change', queue);
  };
}
