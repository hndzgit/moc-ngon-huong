import { useLayoutEffect, useRef, type RefObject } from 'react';

const stack: object[] = [];
let unlockedOverflow = '';
let unlockedPadding = '';

// Keep keyboard focus and page scroll inside an open overlay, restoring both on close.
export function useDialogLifecycle(open:boolean, onClose:()=>void, root?:RefObject<HTMLElement|null>) {
  const close = useRef(onClose);
  close.current = onClose;
  useLayoutEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const entry={};
    if (!stack.length) {
      unlockedOverflow=document.body.style.overflow;
      unlockedPadding=document.body.style.paddingRight;
      const gap=window.innerWidth-document.documentElement.clientWidth;
      if(gap>0)document.body.style.paddingRight=`${parseFloat(getComputedStyle(document.body).paddingRight)+gap}px`;
    }
    stack.push(entry);
    document.body.style.overflow = 'hidden';
    const dialog = () => root?.current
      ? root.current.matches('[role="dialog"]') ? root.current : root.current.querySelector<HTMLElement>('[role="dialog"]')
      : [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].at(-1);
    const focusable = () => [...(dialog()?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || [])]
      .filter(el => el.tabIndex>=0 && el.getClientRects().length > 0 && !el.closest('[inert]'));
    const frame = requestAnimationFrame(() => focusable()[0]?.focus({preventScroll:true}));
    const handleKey = (event:KeyboardEvent) => {
      if (stack.at(-1)!==entry) return;
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key === 'Tab') {
        // WebKit can skip buttons in native Tab order depending on the OS's
        // keyboard-access setting. Move explicitly, rather than only wrapping.
        event.preventDefault();
        const elements=focusable();
        if(!elements.length)return;
        const index=elements.indexOf(document.activeElement as HTMLElement);
        const next=index<0?(event.shiftKey?elements.length-1:0):(index+(event.shiftKey?-1:1)+elements.length)%elements.length;
        elements[next].focus({preventScroll:true});
      }
    };
    document.addEventListener('keydown',handleKey);
    return () => {
      cancelAnimationFrame(frame);
      const wasTop=stack.at(-1)===entry;
      const index=stack.indexOf(entry);
      if(index>=0)stack.splice(index,1);
      if(!stack.length){document.body.style.overflow=unlockedOverflow;document.body.style.paddingRight=unlockedPadding;}
      document.removeEventListener('keydown',handleKey);
      if (wasTop && previousFocus instanceof HTMLElement && previousFocus.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus({preventScroll:true});
    };
  },[open,root]);
}
