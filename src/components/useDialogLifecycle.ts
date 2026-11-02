import { useEffect, useRef, type RefObject } from 'react';

const stack: object[] = [];
let unlockedOverflow = '';

// Keep keyboard focus and page scroll inside an open overlay, restoring both on close.
export function useDialogLifecycle(open:boolean, onClose:()=>void, root?:RefObject<HTMLElement|null>) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const entry={};
    if (!stack.length) unlockedOverflow=document.body.style.overflow;
    stack.push(entry);
    document.body.style.overflow = 'hidden';
    const dialog = () => root?.current
      ? root.current.matches('[role="dialog"]') ? root.current : root.current.querySelector<HTMLElement>('[role="dialog"]')
      : [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].at(-1);
    const focusable = () => [...(dialog()?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || [])]
      .filter(el => el.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => focusable()[0]?.focus({preventScroll:true}));
    const handleKey = (event:KeyboardEvent) => {
      if (stack.at(-1)!==entry) return;
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
      const wasTop=stack.at(-1)===entry;
      const index=stack.indexOf(entry);
      if(index>=0)stack.splice(index,1);
      if(!stack.length)document.body.style.overflow=unlockedOverflow;
      document.removeEventListener('keydown',handleKey);
      if (wasTop && previousFocus instanceof HTMLElement && previousFocus.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus({preventScroll:true});
    };
  },[open,root]);
}
