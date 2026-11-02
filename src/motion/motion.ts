import { useLayoutEffect, useRef, useState } from 'react';
import { motionEngine, loadMotionEngine, whenMotionReady } from './engine-loader';

export const MOTION = { micro: .18, swap: .3, reveal: .6, ease: 'power2.out', stagger: .055 } as const;
const queries = { full: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)', touch: '(max-width: 767px), (pointer: coarse)' };

export function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
}

/** State remains owned by React. Every update reverts its own interrupted tween. */
export function useChangeMotion<T extends HTMLElement>(value: unknown, selector?: string, duration: number = MOTION.swap, initial = false, enabled = true) {
  const ref = useRef<T>(null);
  const previous = useRef(value);
  useLayoutEffect(() => {
    const changed = previous.current !== value;
    previous.current = value;
    const run = changed || initial;
    const root=ref.current;
    if (!run || !enabled || !root) return;
    const gsap=motionEngine;
    if (!gsap) return; // The state update is immediate, even before the optional engine loads.
    const media = gsap.matchMedia();
    media.add(queries, context => {
      if (!context.conditions?.full || !root.isConnected) return;
      const targets = selector ? Array.from(root.querySelectorAll<HTMLElement>(selector)) : [root];
      if (!targets.length) return;
      gsap.fromTo(targets, { opacity: .68, y: context.conditions.touch ? 3 : 7 }, {
        opacity: 1, y: 0, duration, stagger: selector ? MOTION.stagger : 0, ease: MOTION.ease, overwrite: 'auto', clearProps: 'opacity,transform',
      });
    }, ref);
    return () => media.revert();
  }, [value, selector, duration, initial, enabled]);
  return ref;
}

/** Keep an exiting overlay mounted, without delaying its opening or state updates. */
export function usePresenceMotion<T extends HTMLElement>(open: boolean, kind: 'cart' | 'search' | 'chat' | 'modal' | 'menu' = 'modal') {
  const [present, setPresent] = useState(open);
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    if (open && !present) { setPresent(true); return; }
    if (!present || !ref.current) return;
    const gsap=motionEngine;
    if (!gsap) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { if(!open)setPresent(false); return; }
      void loadMotionEngine();
      const root=ref.current;
      root.dataset.motionFallback=kind;
      const timer=window.setTimeout(()=>{if(!open)setPresent(false)},open?350:200);
      return ()=>{clearTimeout(timer);delete root.dataset.motionFallback};
    }
    const media = gsap.matchMedia();
    media.add(queries, context => {
      if (!context.conditions?.full) { if (!open) setPresent(false); return; }
      const root = ref.current!;
      const panel = root.querySelector<HTMLElement>('[role="dialog"]') || root;
      const duration = kind === 'chat' ? .3 : context.conditions.touch ? .22 : .3;
      const shift = kind === 'cart' ? { xPercent: 100 } : { y: kind === 'menu' ? -6 : 12 };
      const timeline = gsap.timeline({ onComplete: () => { if (!open) setPresent(false); } });
      if (open) {
        timeline.fromTo(root, { opacity: 0 }, { opacity: 1, duration: .18, clearProps: 'opacity' }, 0);
        timeline.fromTo(panel, shift, { xPercent: 0, y: 0, duration, ease: MOTION.ease, clearProps: 'transform' }, 0);
      } else {
        timeline.to(root, { opacity: 0, duration: .18, ease: 'power1.in' }, 0);
        timeline.to(panel, { ...shift, duration: .2, ease: 'power1.in' }, 0);
      }
    }, ref);
    return () => media.revert();
  }, [open, present, kind]);
  return { ref, present, phase: open ? 'open' : 'closing' };
}

/** No pin/scrub or hidden offscreen content. Reveal only when the element enters. */
export function usePageMotion(route: string) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const scope=ref.current;
    if (!scope) return;
    let revert=()=>{};
    const unsubscribe=whenMotionReady(gsap=>{
    if (!scope.isConnected) return;
    const media = gsap.matchMedia();
    revert=()=>media.revert();
    media.add(queries, context => {
      if (!context.conditions?.full) return;
      const targets = scope.querySelectorAll<HTMLElement>(
        'main section > .figma-container > .text-center, main .story-page section h2, main .home-teas .product-card, main .products-page > section:last-child .product-card, main .home-unboxing .grid > div' +
        (context.conditions.touch ? '' : ', main .story-page section:not(:first-child) .overflow-hidden'),
      );
      if (typeof IntersectionObserver === 'undefined') return;
      // One-shot reveals need no scroll polling, pinning, or ScrollTrigger bundle.
      let active=true;
      const initiallyVisible=new Set<Element>(Array.from(targets).filter(target=>{const rect=target.getBoundingClientRect();return rect.top<innerHeight*.92&&rect.bottom>0}));
      const observer=new IntersectionObserver(entries=>{
        if(!active) return;
        entries.filter(entry=>entry.isIntersecting).forEach(({target})=>{
          observer.unobserve(target);
          if(initiallyVisible.delete(target))return;
          context.add(() => {
            const touch=context.conditions?.touch;
            gsap.fromTo(target, touch ? {opacity:.8} : { opacity: .72, y: 14 }, {
              opacity: 1, ...(touch ? {} : {y:0}), duration: touch ? .35 : MOTION.reveal,
              ease: MOTION.ease, clearProps: touch ? 'opacity' : 'opacity,transform',
            });
          });
        });
      },{rootMargin:'0px 0px -8% 0px'});
      targets.forEach(target=>observer.observe(target));
      return ()=>{active=false;observer.disconnect()};
    }, ref);
    });
    return () => {unsubscribe();revert()};
  }, [route]);
  return ref;
}

export function getMotionDiagnostics() {
  return {engineLoaded:Boolean(motionEngine),activeTweens:motionEngine?.globalTimeline.getChildren(true,true,true).filter(tween=>tween.isActive()).length || 0};
}
