import Image from "next/image";
import { notFound } from "next/navigation";
import { ShareActions } from "@/components/ShareActions";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await (await createClient()).from("properties").select("*").eq("id", id).eq("availability", "available").single();
  if (!data) notFound();
  const property = data as Property;
  return <main className="mx-auto max-w-7xl px-6 py-12">
    <div className="grid gap-3 md:grid-cols-2">{property.images?.length ? property.images.slice(0, 4).map((image, index) => <div key={image} className={`relative overflow-hidden rounded-3xl bg-cream ${index === 0 ? "aspect-[16/10] md:row-span-2 md:aspect-auto" : "aspect-[16/8]"}`}><Image src={image} alt={`${property.title} gallery image ${index + 1}`} fill unoptimized className="object-cover"/></div>) : <div className="flex aspect-[16/7] items-center justify-center rounded-3xl bg-gradient-to-br from-ink to-sage text-2xl font-black text-white md:col-span-2">Realtors X</div>}</div>
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]"><section><p className="text-sm font-bold uppercase tracking-wider text-sage">{property.type}{property.project_name ? ` · ${property.project_name}` : ""}</p><h1 className="mt-3 text-4xl font-black md:text-5xl">{property.title}</h1><p className="mt-3 text-lg text-ink/50">{property.location}</p><div className="mt-7 flex flex-wrap gap-3">{property.features.map(feature => <span key={feature} className="rounded-full bg-white px-4 py-2 text-sm shadow-sm">{feature}</span>)}</div><h2 className="mt-10 text-xl font-bold">About this property</h2><p className="mt-3 whitespace-pre-line leading-8 text-ink/65">{property.description}</p></section>
      <aside className="card h-fit p-6"><p className="text-3xl font-black">${Number(property.price).toLocaleString()}</p><p className="mt-3 text-sm text-ink/55">{property.bedrooms} bedrooms · {property.bathrooms} bathrooms · {Number(property.size).toLocaleString()} sq ft</p>{property.investment_opportunity && <div className="mt-5 rounded-2xl bg-lime p-4"><p className="text-xs font-bold uppercase text-sage">Investment opportunity</p>{property.expected_roi && <p className="mt-1 text-2xl font-black text-sage">{property.expected_roi}% expected ROI</p>}{property.completion_date && <p className="mt-2 text-sm">Completion: {property.completion_date}</p>}</div>}<div className="mt-6"><ShareActions title={property.title}/></div></aside>
    </div>
  </main>;
}
