import { useEffect, useRef } from 'react';

// Keep keyboard focus and page scroll inside an open overlay, restoring both on close.
export function useDialogLifecycle(open:boolean, onClose:()=>void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = () => [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].at(-1);
    const focusable = () => [...(dialog()?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || [])]
      .filter(el => el.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => focusable()[0]?.focus());
    const handleKey = (event:KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key === 'Tab') {
        const elements=focusable(), first=elements[0], last=elements.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement===first || !dialog()?.contains(document.activeElement))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (document.activeElement===last || !dialog()?.contains(document.activeElement))) {
          event.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown',handleKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow=previousOverflow;
      document.removeEventListener('keydown',handleKey);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({preventScroll:true});
    };
  },[open]);
}
