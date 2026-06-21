"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { FeaturedMedia } from "@/lib/types";

export function FeaturedMediaAsset({ item, background = false, priority = false, fit = "cover", className = "" }: { item: FeaturedMedia; background?: boolean; priority?: boolean; fit?: "cover" | "contain"; className?: string }) {
  const [motionAllowed, setMotionAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionAllowed(!query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const mediaClass = `h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} ${className}`;
  if (item.media_type === "image") return <Image src={item.media_url} alt={item.title} fill unoptimized priority={priority} className={mediaClass}/>;
  if (background) {
    if (motionAllowed) return <video src={item.media_url} poster={item.thumbnail_url ?? undefined} autoPlay muted loop playsInline aria-label={item.title} className={mediaClass}/>;
    return item.thumbnail_url ? <Image src={item.thumbnail_url} alt={`${item.title} video poster`} fill unoptimized priority={priority} className={mediaClass}/> : <div className="h-full w-full bg-gradient-to-br from-ink to-sage" aria-label={`${item.title} video`}/>;
  }
  return <video src={item.media_url} poster={item.thumbnail_url ?? undefined} controls preload="metadata" playsInline aria-label={item.title} className={mediaClass}>Your browser does not support video playback.</video>;
}
