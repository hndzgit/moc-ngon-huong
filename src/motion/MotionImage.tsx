import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { useChangeMotion, MOTION } from './motion';

// Coalesce concurrent requests, without retaining decoded image elements in memory.
const ready = new Set<string>();
const pending = new Map<string, Promise<boolean>>();
function prepareImage(src:string, srcSet?:string, sizes?:string) {
  const key = srcSet ? `${src}|${srcSet}` : src;
  if (ready.has(key)) return Promise.resolve(true);
  const existing=pending.get(key);
  if (existing) return existing;
  const image=new Image();
  if (sizes) image.sizes=sizes;
  if (srcSet) image.srcset=srcSet;
  image.src=src;
  const request=image.decode().then(()=>{
    ready.add(key);
    if(ready.size>24)ready.delete(ready.values().next().value!);
    return true;
  },()=>false).finally(()=>pending.delete(key));
  pending.set(key,request);
  return request;
}

// Keep the previous decoded photograph while the next original asset is loading.
// A cancelled request never commits a stale slide after rapid selection.
export function MotionImage({src, srcSet, sizes, ...props}: ImgHTMLAttributes<HTMLImageElement>) {
  const [displayed,setDisplayed]=useState(()=>({src,srcSet,sizes}));
  const [failed,setFailed]=useState(false);
  const ref=useChangeMotion<HTMLImageElement>(displayed.src,undefined,MOTION.swap);
  useEffect(()=>{
    if (src===displayed.src && srcSet===displayed.srcSet && sizes===displayed.sizes) { setFailed(false); return; }
    if (!src) { setDisplayed({src,srcSet,sizes}); return; }
    setFailed(false);
    let cancelled=false;
    void prepareImage(src,srcSet,sizes).then(ok=>{
      if(cancelled)return;
      if(ok)setDisplayed({src,srcSet,sizes});
      else setFailed(true); // Keep the previous photograph when a new asset fails.
    });
    return ()=>{cancelled=true};
  },[src,srcSet,sizes,displayed.src,displayed.srcSet,displayed.sizes]);
  return <img {...props} src={displayed.src} srcSet={displayed.srcSet} sizes={displayed.sizes} ref={ref} aria-busy={src!==displayed.src&&!failed || undefined} data-image-error={failed || undefined} />;
}
