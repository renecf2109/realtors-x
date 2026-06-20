import { PublicPropertyCard } from "@/components/PublicPropertyCard";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";

export default async function InvestmentsPage() {
  const { data } = await (await createClient()).from("public_properties").select("*").eq("investment_opportunity", true).order("expected_roi", { ascending: false, nullsFirst: false });
  const properties = (data ?? []) as Property[];
  return <main className="mx-auto max-w-7xl px-6 py-14">
    <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-sage">Investor desk</p><h1 className="mt-3 text-5xl font-black tracking-tight">Real estate investment opportunities.</h1><p className="mt-5 text-lg leading-8 text-ink/55">Explore income-producing properties and new developments selected for investors. Review projected return information, project timelines, and available units.</p></div>
    {properties.length ? <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{properties.map(property => <PublicPropertyCard key={property.id} property={property}/>)}</div> : <div className="card mt-10 p-12 text-center"><h2 className="text-xl font-bold">Investment listings are coming soon.</h2><p className="mt-2 text-sm text-ink/50">Agents can mark any listing as an investment opportunity from the AI Listing Studio.</p></div>}
  </main>;
}
