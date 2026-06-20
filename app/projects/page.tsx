import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";

export default async function ProjectsPage() {
  const { data } = await (await createClient()).from("public_properties").select("*").not("project_name", "is", null).order("created_at", { ascending: false });
  const grouped = new Map<string, Property[]>();
  for (const property of (data ?? []) as Property[]) if (property.project_name) grouped.set(property.project_name, [...(grouped.get(property.project_name) ?? []), property]);
  return <main className="mx-auto max-w-7xl px-6 py-14"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-sage">Developments</p><h1 className="mt-3 text-5xl font-black tracking-tight">Explore projects, project by project.</h1><p className="mt-5 text-lg leading-8 text-ink/55">See every available unit, gallery, investment detail, and completion timeline in one place.</p></div>
    {grouped.size ? <div className="mt-10 grid gap-6 md:grid-cols-2">{Array.from(grouped.entries()).map(([name, listings]) => { const cover = listings.find(item => item.images?.length)?.images[0]; const fromPrice = Math.min(...listings.map(item => Number(item.price))); return <Link href={`/projects/${encodeURIComponent(name)}`} key={name} className="card group overflow-hidden"><div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-ink to-sage">{cover ? <Image src={cover} alt={`${name} project`} fill unoptimized className="object-cover transition duration-500 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center text-2xl font-black text-white">{name}</div>}</div><div className="p-6"><p className="text-xs font-bold uppercase text-sage">{listings.length} available unit{listings.length === 1 ? "" : "s"}</p><h2 className="mt-2 text-2xl font-black">{name}</h2><p className="mt-2 text-sm text-ink/50">From ${fromPrice.toLocaleString()}</p></div></Link>; })}</div> : <div className="card mt-10 p-12 text-center"><h2 className="text-xl font-bold">Projects are coming soon.</h2><p className="mt-2 text-sm text-ink/50">Add a project name to listings in the AI Listing Studio.</p></div>}
  </main>;
}
