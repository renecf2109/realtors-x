import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";
import type { Lead } from "@/lib/types";
import type { AgentProfile } from "@/lib/types";
import { AgentProfileCard } from "@/components/AgentProfileCard";
import { LeadWhatsAppButton } from "@/components/LeadWhatsAppButton";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: leads }, { count: listingCount }, { data: profile }] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
  ]);
  const typedLeads = (leads ?? []) as Lead[];
  return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
    <DashboardNav/>
    <section>
      <p className="text-sm font-semibold text-sage">Good to see you</p><h1 className="mt-1 text-4xl font-black">Your dashboard</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Total leads" value={typedLeads.length}/><Stat label="Active listings" value={listingCount ?? 0}/><Stat label="New this week" value={typedLeads.filter(l=>Date.now()-new Date(l.created_at).getTime()<604800000).length}/>
      </div>
      <AgentProfileCard profile={(profile as AgentProfile | null) ?? null}/>
      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-ink/10 p-6"><h2 className="text-xl font-bold">Buyer leads</h2><p className="text-sm text-ink/50">People who asked to hear from an agent.</p></div>
        {typedLeads.length === 0 ? <p className="p-8 text-center text-ink/50">No leads yet. Share the public chat page to get started.</p> :
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-cream text-xs uppercase text-ink/45"><tr><th className="p-4">Buyer</th><th className="p-4">Request</th><th className="p-4">Budget</th><th className="p-4">Move-in</th><th className="p-4">Phone</th><th className="p-4">WhatsApp</th></tr></thead><tbody>{typedLeads.map(lead=><tr key={lead.id} className="border-t border-ink/5"><td className="p-4 font-semibold">{lead.name}<div className="font-normal text-ink/45">{lead.preferred_area}</div></td><td className="p-4 capitalize">{lead.requested_property_type}{lead.property_ids?.length ? <div className="text-xs font-normal text-sage">{lead.property_ids.length} selected listing(s)</div> : null}</td><td className="p-4">${Number(lead.budget).toLocaleString()}</td><td className="p-4">{lead.move_in_date || "Flexible"}</td><td className="p-4">{lead.phone}</td><td className="p-4"><LeadWhatsAppButton lead={lead}/></td></tr>)}</tbody></table></div>}
      </div>
    </section>
  </main>;
}

function Stat({label,value}:{label:string,value:number}) { return <div className="card p-6"><p className="text-sm text-ink/50">{label}</p><p className="mt-2 text-4xl font-black">{value}</p></div>; }
