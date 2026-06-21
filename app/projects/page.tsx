import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";

export const metadata: Metadata = { title: "Real estate projects", description: "Browse real estate developments and available project units on Realtors X." };
export default async function ProjectsPage() {
  const { data, error } = await (await createClient()).from("public_properties").select("*").not("project_name", "is", null).order("created_at", { ascending: false });
  if (error) throw new Error("Real estate projects are temporarily unavailable.");
  const grouped = new Map<string, Property[]>();
  for (const property of (data ?? []) as Property[]) if (property.project_name) grouped.set(property.project_name, [...(grouped.get(property.project_name) ?? []), property]);
  return <main className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16"><div className="max-w-3xl"><p className="eyebrow">Developments</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Explore projects, project by project.</h1><p className="mt-5 text-lg leading-8 text-ink/55">See every available unit, gallery, investment detail, and completion timeline in one place.</p></div>
    {grouped.size ? <div className="mt-10 grid gap-6 md:grid-cols-2">{Array.from(grouped.entries()).map(([name, listings]) => { const cover = listings.find(item => item.images?.length)?.images[0]; const prices = listings.flatMap(item => item.price === null ? [] : [Number(item.price)]); const fromPrice = prices.length ? Math.min(...prices) : null; return <Link href={`/projects/${encodeURIComponent(name)}`} key={name} className="card group overflow-hidden"><div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-ink to-sage">{cover ? <Image src={cover} alt={`${name} project`} fill unoptimized className="object-cover transition duration-500 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center px-5 text-center text-2xl font-black text-white">{name}</div>}</div><div className="p-6"><p className="text-xs font-bold uppercase text-sage">{listings.length} available unit{listings.length === 1 ? "" : "s"}</p><h2 className="mt-2 text-2xl font-black">{name}</h2><p className="mt-2 text-sm text-ink/50">{fromPrice === null ? "Price on request" : `From $${fromPrice.toLocaleString()}`}</p></div></Link>; })}</div> : <div className="card mt-10 p-8 text-center sm:p-12"><h2 className="text-xl font-bold">Projects are coming soon.</h2><p className="mt-2 text-sm leading-6 text-ink/50">Add a project name to listings in the AI Listing Studio.</p></div>}
  </main>;
}
