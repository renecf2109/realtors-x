import { redirect } from "next/navigation";
import { AgentInventorySearch } from "@/components/AgentInventorySearch";
import { DashboardNav } from "@/components/DashboardNav";
import { createClient } from "@/lib/supabase/server";

export default async function AgentSearchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav isAdmin={profile?.role === "admin"}/><AgentInventorySearch/></main>;
}
