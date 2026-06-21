import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { ImportUploader } from "@/components/ImportUploader";
import { createClient } from "@/lib/supabase/server";

export default async function NewImportPage() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login"); const { data: profile } = await supabase.from("profiles").select("role").eq("id",user.id).single(); if (!profile || !["agent","admin"].includes(profile.role)) redirect("/chat"); return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav isAdmin={profile.role === "admin"}/><ImportUploader/></main>; }
