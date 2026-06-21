import Link from "next/link";
import { FeaturedMediaAsset } from "@/components/FeaturedMediaAsset";
import type { FeaturedMedia } from "@/lib/types";

export function FeaturedMediaStrip({ items, title = "Featured now", dark = false }: { items: FeaturedMedia[]; title?: string; dark?: boolean }) {
  if (!items.length) return null;
  return <section className={dark ? "bg-ink text-white" : "bg-white"}><div className="mx-auto max-w-7xl px-6 py-14 sm:py-18"><div className="flex items-end justify-between gap-4"><div><p className={dark ? "text-xs font-bold uppercase tracking-[.18em] text-[#46b4f5]" : "eyebrow"}>Realtors X selection</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h2></div></div><div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map(item => <MediaCard key={item.id} item={item} dark={dark}/>)}</div></div></section>;
}

function MediaCard({ item, dark }: { item: FeaturedMedia; dark: boolean }) {
  return <article className={`group overflow-hidden rounded-3xl border ${dark ? "border-white/10 bg-white/5" : "border-ink/10 bg-cream"}`}><div className="relative aspect-video overflow-hidden"><FeaturedMediaAsset item={item} className="transition duration-500 group-hover:scale-105"/></div><div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-sage">{item.media_type}</p><h3 className="mt-2 text-xl font-black">{item.title}</h3>{item.description ? <p className={`mt-2 text-sm leading-6 ${dark ? "text-white/60" : "text-ink/55"}`}>{item.description}</p> : null}{item.link_url ? <Link href={item.link_url} className="mt-4 inline-block text-sm font-bold text-sage">View details →</Link> : null}</div></article>;
}
