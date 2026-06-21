import { createClient } from "@/lib/supabase/server";
import { PublicPropertyCard } from "@/components/PublicPropertyCard";
import type { Property } from "@/lib/types";

export const metadata = { title: "Property Listings | Realtors X", description: "Browse active Realtors X properties and find a home or investment that matches your goals." };

export default async function PublicListingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("public_properties").select("*").order("created_at", { ascending: false });
  const listings = (data ?? []) as Property[];
  return <main className="mx-auto max-w-7xl px-6 py-12 sm:py-16">
    <p className="text-sm font-bold uppercase tracking-[.18em] text-sage">Live inventory</p>
    <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-4xl font-black sm:text-5xl">Properties selected for you.</h1><p className="mt-3 max-w-2xl text-ink/55">Browse active opportunities, then use the AI workbench to narrow the collection by area, budget, size, or features.</p></div><a href="/chat" className="btn-primary shrink-0">Search with AI</a></div>
    {listings.length ? <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{listings.map(listing => <PublicPropertyCard key={listing.id} property={listing}/>)}</div> : <div className="card mt-10 p-10 text-center"><h2 className="text-xl font-bold">Fresh opportunities are coming soon.</h2><p className="mt-2 text-sm text-ink/50">Tell the AI workbench what you need and an agent can follow up.</p></div>}
  </main>;
}
