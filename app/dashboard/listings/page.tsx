import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/DashboardNav";
import { ListingsManager } from "@/components/ListingsManager";
import type { Property } from "@/lib/types";

export default async function DashboardListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data }, { data: profile }] = await Promise.all([
    supabase.from("listings").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  ]);
  if (profile?.role !== "agent" && profile?.role !== "admin") redirect("/chat");
  return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav isAdmin={profile?.role === "admin"}/><ListingsManager initialProperties={(data ?? []) as Property[]} currentUserId={user.id}/></main>;
}
