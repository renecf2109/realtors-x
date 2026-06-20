import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";
import { ListingsManager } from "@/components/ListingsManager";
import type { Property } from "@/lib/types";

export default async function ListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("properties").select("*").eq("agent_id", user.id).order("created_at", { ascending: false });
  return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav/><ListingsManager initialProperties={(data ?? []) as Property[]}/></main>;
}
