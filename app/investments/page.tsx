import type { Metadata } from "next";
import { PublicPropertyCard } from "@/components/PublicPropertyCard";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";

export const metadata: Metadata = { title: "Real estate investments", description: "Explore real estate investment opportunities listed on Realtors X." };
export default async function InvestmentsPage() {
  const { data, error } = await (await createClient()).from("public_properties").select("*").eq("investment_opportunity", true).order("expected_roi", { ascending: false, nullsFirst: false });
  if (error) throw new Error("Investment listings are temporarily unavailable.");
  const properties = (data ?? []) as Property[];
  return <main className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16">
    <div className="max-w-3xl"><p className="eyebrow">Investor desk</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Real estate investment opportunities.</h1><p className="mt-5 text-lg leading-8 text-ink/55">Explore income-producing properties and new developments selected for investors. Review projected return information, project timelines, and available units.</p></div>
    {properties.length ? <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{properties.map(property => <PublicPropertyCard key={property.id} property={property}/>)}</div> : <div className="card mt-10 p-8 text-center sm:p-12"><h2 className="text-xl font-bold">Investment listings are coming soon.</h2><p className="mt-2 text-sm leading-6 text-ink/50">Agents can mark any listing as an investment opportunity from the AI Listing Studio.</p></div>}
  </main>;
}
