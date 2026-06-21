import Image from "next/image";
import { notFound } from "next/navigation";
import { ShareActions } from "@/components/ShareActions";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";
import { FeaturedMediaAsset } from "@/components/FeaturedMediaAsset";
import { getActiveFeaturedMedia } from "@/lib/featuredMediaServer";
import { formatListingPrice } from "@/lib/listingPrice";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [propertyResult, featuredItems, mediaResult] = await Promise.all([
    supabase.from("public_properties").select("*").eq("id", id).single(),
    getActiveFeaturedMedia(["gallery", "listing_featured"]),
    supabase.from("listing_media").select("*").eq("listing_id", id).order("sort_order")
  ]);
  const { data } = propertyResult;
  if (!data) notFound();
  const property = data as Property;
  const listingPaths = [`/properties/${id}`, `/listings/${id}`];
  const galleryMedia = featuredItems.filter(item => item.placement === "gallery" || (item.placement === "listing_featured" && (!item.link_url || listingPaths.some(path => item.link_url === path || item.link_url?.endsWith(path)))));
  const listingMedia = ((mediaResult.data ?? []) as { id: string; media_type: "image" | "video"; media_url: string; thumbnail_url: string | null; alt_text: string | null }[]).filter(item => !property.images?.includes(item.media_url));
  return <main className="mx-auto max-w-7xl px-6 py-12">
    {(property.images?.length || listingMedia.length || galleryMedia.length) ? <div className="grid gap-3 md:grid-cols-2">{property.images?.slice(0, 6).map((image, index) => <div key={image} className={`relative overflow-hidden rounded-3xl bg-cream ${index === 0 ? "aspect-[16/10] md:row-span-2 md:aspect-auto" : "aspect-video"}`}><Image src={image} alt={`${property.title} gallery image ${index + 1}`} fill unoptimized className="object-cover"/></div>)}{listingMedia.map(item => <div key={item.id} className="relative aspect-video overflow-hidden rounded-3xl bg-ink">{item.media_type === "video" ? <video src={item.media_url} poster={item.thumbnail_url ?? undefined} controls preload="metadata" playsInline aria-label={item.alt_text || property.title} className="h-full w-full object-cover"/> : <Image src={item.media_url} alt={item.alt_text || property.title} fill unoptimized className="object-cover"/>}</div>)}{galleryMedia.map(item => <div key={item.id} className="relative aspect-video overflow-hidden rounded-3xl bg-ink"><FeaturedMediaAsset item={item}/><span className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-3 py-1 text-xs font-bold text-white backdrop-blur">{item.title}</span></div>)}</div> : <div className="flex aspect-[16/7] items-center justify-center rounded-3xl bg-gradient-to-br from-ink to-sage text-2xl font-black text-white">Realtors X</div>}
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]"><section><p className="text-sm font-bold uppercase tracking-wider text-sage">{property.type}{property.project_name ? ` · ${property.project_name}` : ""}</p><h1 className="mt-3 text-4xl font-black md:text-5xl">{property.title}</h1><p className="mt-3 text-lg text-ink/50">{property.location}</p>{property.show_developer_to_public && property.developer_name && <p className="mt-2 text-sm font-semibold text-ink/55">Developed by {property.developer_name}</p>}<div className="mt-7 flex flex-wrap gap-3">{property.features.map(feature => <span key={feature} className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">{feature}</span>)}</div><h2 className="mt-10 text-xl font-bold">About this property</h2><p className="mt-3 whitespace-pre-line leading-8 text-ink/65">{property.description}</p></section>
      <aside className="card h-fit p-6"><p className="text-3xl font-black">{formatListingPrice(property)}</p><p className="mt-3 text-sm text-ink/55">{property.bedrooms} bedrooms · {property.bathrooms} bathrooms · {Number(property.size).toLocaleString()} sq ft</p>{property.investment_opportunity && <div className="mt-5 rounded-2xl bg-lime p-4"><p className="text-xs font-bold uppercase text-sage">Investment opportunity</p>{property.expected_roi && <p className="mt-1 text-2xl font-black text-sage">{property.expected_roi}% expected ROI</p>}{property.completion_date && <p className="mt-2 text-sm">Completion: {property.completion_date}</p>}</div>}<div className="mt-6"><ShareActions title={property.title}/></div></aside>
    </div>
  </main>;
}
