import { redirect } from "next/navigation";
import { AgentInventorySearch } from "@/components/AgentInventorySearch";
import { DashboardNav } from "@/components/DashboardNav";
import { createClient } from "@/lib/supabase/server";

export default async function AgentSearchPage() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect("/login");
  return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav/><AgentInventorySearch/></main>;
}
