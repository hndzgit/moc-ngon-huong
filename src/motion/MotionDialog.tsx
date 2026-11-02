import { cloneElement, type ReactElement, type RefObject } from 'react';
import { useDialogLifecycle } from '../components/useDialogLifecycle';
import { usePresenceMotion } from './motion';

// Clone the existing backdrop; no extra layout wrapper or remounted form.
export function MotionDialog({open, onClose, children}: {open:boolean; onClose:()=>void; children:ReactElement}) {
  const {ref,present,phase}=usePresenceMotion<HTMLDivElement>(open);
  useDialogLifecycle(present,()=>{if(open)onClose()},ref);
  if (!present) return null;
  return cloneElement(children as ReactElement<{ref:RefObject<HTMLDivElement|null>; 'data-motion-phase':string; inert:boolean}>, {
    ref, 'data-motion-phase':phase, inert:!open,
  });
}
