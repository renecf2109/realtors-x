import Link from "next/link";
import { FeaturedMediaAsset } from "@/components/FeaturedMediaAsset";
import type { FeaturedMedia } from "@/lib/types";

export function FeaturedMediaStrip({ items, title = "Featured now", dark = false, billboard = false }: { items: FeaturedMedia[]; title?: string; dark?: boolean; billboard?: boolean }) {
  if (!items.length) return null;
  if (billboard) return <section aria-label={title} className="bg-ink">{items.map(item => <Billboard key={item.id} item={item}/>)}</section>;
  return <section className={dark ? "bg-ink text-white" : "bg-white"}><div className="mx-auto max-w-7xl px-6 py-14 sm:py-18"><div className="flex items-end justify-between gap-4"><div><p className={dark ? "text-xs font-bold uppercase tracking-[.18em] text-[#46b4f5]" : "eyebrow"}>Realtors X selection</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h2></div></div><div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map(item => <MediaCard key={item.id} item={item} dark={dark}/>)}</div></div></section>;
}

function Billboard({ item }: { item: FeaturedMedia }) {
  const logoPreview = item.media_url.endsWith("/logo.png");
  return <article className="relative flex min-h-[62svh] items-end overflow-hidden border-t border-white/15 bg-white sm:min-h-[70svh]"><div className="absolute inset-0"><FeaturedMediaAsset item={item} background fit={logoPreview ? "contain" : "cover"} className={logoPreview ? "bg-white p-8 sm:p-16" : ""}/><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"/></div><div className="relative z-10 w-full border-t border-white/20 bg-black/30 px-5 py-8 text-white backdrop-blur-md sm:px-8 sm:py-10"><div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#54baff]">Featured campaign</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{item.title}</h2>{item.description ? <p className="mt-3 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">{item.description}</p> : null}</div>{item.link_url ? <Link href={item.link_url} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 px-6 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-xl transition hover:bg-white hover:text-ink">Explore featured projects →</Link> : null}</div></div></article>;
}

function MediaCard({ item, dark }: { item: FeaturedMedia; dark: boolean }) {
  return <article className={`group overflow-hidden rounded-3xl border ${dark ? "border-white/10 bg-white/5" : "border-ink/10 bg-cream"}`}><div className="relative aspect-video overflow-hidden"><FeaturedMediaAsset item={item} className="transition duration-500 group-hover:scale-105"/></div><div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-sage">{item.media_type}</p><h3 className="mt-2 text-xl font-black">{item.title}</h3>{item.description ? <p className={`mt-2 text-sm leading-6 ${dark ? "text-white/60" : "text-ink/55"}`}>{item.description}</p> : null}{item.link_url ? <Link href={item.link_url} className="mt-4 inline-block text-sm font-bold text-sage">View details →</Link> : null}</div></article>;
}
