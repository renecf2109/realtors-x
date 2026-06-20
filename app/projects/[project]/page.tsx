import { notFound } from "next/navigation";
import { PublicPropertyCard } from "@/components/PublicPropertyCard";
import { ShareActions } from "@/components/ShareActions";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";

export default async function ProjectPage({ params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const name = decodeURIComponent(project);
  const { data } = await (await createClient()).from("public_properties").select("*").eq("project_name", name).order("price");
  const properties = (data ?? []) as Property[];
  if (!properties.length) notFound();
  const roi = Math.max(...properties.map(item => Number(item.expected_roi ?? 0)));
  const completion = properties.find(item => item.completion_date)?.completion_date;
  return <main className="mx-auto max-w-7xl px-6 py-14"><div className="rounded-[2.5rem] bg-ink p-8 text-white md:p-12"><p className="text-sm font-bold uppercase tracking-[.18em] text-sage">Realtors X project</p><div className="mt-4 flex flex-wrap items-end justify-between gap-6"><div><h1 className="text-4xl font-black md:text-6xl">{name}</h1><p className="mt-4 text-white/60">{properties.length} available unit{properties.length === 1 ? "" : "s"}{completion ? ` · Completion ${completion}` : ""}{roi > 0 ? ` · Up to ${roi}% expected ROI` : ""}</p></div><ShareActions title={`${name} project`}/></div></div>
    <h2 className="mt-12 text-2xl font-black">Available listings</h2><div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{properties.map(property => <PublicPropertyCard key={property.id} property={property}/>)}</div></main>;
}
