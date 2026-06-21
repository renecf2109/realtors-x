import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { ImportHistory } from "@/components/ImportHistory";
import { createClient } from "@/lib/supabase/server";
import type { ListingImportSummary } from "@/lib/types";

export default async function ImportsPage() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login"); const [{ data: profile }, { data }] = await Promise.all([supabase.from("profiles").select("role").eq("id",user.id).single(), supabase.from("listing_imports").select("*").order("created_at",{ascending:false})]); if (!profile || !["agent","admin"].includes(profile.role)) redirect("/chat"); return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav isAdmin={profile.role === "admin"}/><ImportHistory imports={(data ?? []) as ListingImportSummary[]}/></main>; }
