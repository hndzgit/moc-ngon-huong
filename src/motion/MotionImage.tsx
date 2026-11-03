import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { useChangeMotion, MOTION } from './motion';

// Coalesce concurrent requests, without retaining decoded image elements in memory.
const ready = new Set<string>();
const pending = new Map<string, Promise<boolean>>();
function prepareImage(src:string) {
  if (ready.has(src)) return Promise.resolve(true);
  const existing=pending.get(src);
  if (existing) return existing;
  const image=new Image();image.src=src;
  const request=image.decode().then(()=>{
    ready.add(src);
    if(ready.size>24)ready.delete(ready.values().next().value!);
    return true;
  },()=>false).finally(()=>pending.delete(src));
  pending.set(src,request);
  return request;
}

// Keep the previous decoded photograph while the next original asset is loading.
// A cancelled request never commits a stale slide after rapid selection.
export function MotionImage({src, ...props}: ImgHTMLAttributes<HTMLImageElement>) {
  const [displayed,setDisplayed]=useState(src);
  const [failed,setFailed]=useState(false);
  const ref=useChangeMotion<HTMLImageElement>(displayed,undefined,MOTION.swap);
  useEffect(()=>{
    if (src===displayed) { setFailed(false); return; }
    if (!src) { setDisplayed(src); return; }
    setFailed(false);
    let cancelled=false;
    void prepareImage(src).then(ok=>{
      if(cancelled)return;
      if(ok)setDisplayed(src);
      else setFailed(true); // Keep the previous photograph when a new asset fails.
    });
    return ()=>{cancelled=true};
  },[src,displayed]);
  return <img {...props} src={displayed} ref={ref} aria-busy={src!==displayed&&!failed || undefined} data-image-error={failed || undefined} />;
}
