import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { useChangeMotion, MOTION } from './motion';

// Keep the previous decoded photograph while the next original asset is loading.
// A cancelled request never commits a stale slide after rapid selection.
export function MotionImage({src, ...props}: ImgHTMLAttributes<HTMLImageElement>) {
  const [displayed,setDisplayed]=useState(src);
  const ref=useChangeMotion<HTMLImageElement>(displayed,undefined,MOTION.swap);
  useEffect(()=>{
    if (src===displayed) return;
    if (!src || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplayed(src); return; }
    let cancelled=false;
    const image=new Image();image.src=src;
    const commit=()=>{if(!cancelled)setDisplayed(src)};
    image.decode().then(commit,commit);
    return ()=>{cancelled=true};
  },[src,displayed]);
  return <img {...props} src={displayed} ref={ref} />;
}
