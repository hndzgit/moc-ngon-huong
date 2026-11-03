import { cloneElement, type ReactElement, type RefObject, type MouseEventHandler, type KeyboardEventHandler } from 'react';
import { useDialogLifecycle } from '../components/useDialogLifecycle';
import { usePresenceMotion } from './motion';

// Clone the existing backdrop; no extra layout wrapper or remounted form.
export function MotionDialog({open, onClose, children}: {open:boolean; onClose:()=>void; children:ReactElement}) {
  const {ref,present,phase}=usePresenceMotion<HTMLDivElement>(open);
  useDialogLifecycle(present,()=>{if(open)onClose()},ref);
  if (!present) return null;
  const element=children as ReactElement<{ref:RefObject<HTMLDivElement|null>; 'data-motion-phase':string; 'data-motion-modal':boolean; inert:boolean; onClickCapture?:MouseEventHandler<HTMLDivElement>; onKeyDownCapture?:KeyboardEventHandler<HTMLDivElement>}>;
  return cloneElement(element, {
    ref, 'data-motion-phase':phase, 'data-motion-modal':true, inert:false,
    // Keep the backdrop hit-testable until its exit finishes; inert on the
    // entire overlay would let a second click reach the page underneath.
    onClickCapture:event=>{if(!open){event.preventDefault();event.stopPropagation();return;}element.props.onClickCapture?.(event);},
    onKeyDownCapture:event=>{if(!open){event.preventDefault();event.stopPropagation();return;}element.props.onKeyDownCapture?.(event);},
  });
}
