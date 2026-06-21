import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { InquiryList } from "@/components/InquiryList";
import { createClient } from "@/lib/supabase/server";
import type { AIInquiry } from "@/lib/types";

export default async function InquiriesPage() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login"); const [{ data: profile }, { data }] = await Promise.all([supabase.from("profiles").select("role").eq("id",user.id).single(), supabase.from("ai_inquiries").select("*").order("created_at",{ascending:false})]); if (!profile || !["agent","admin"].includes(profile.role)) redirect("/chat"); return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav isAdmin={profile.role === "admin"}/><InquiryList initialInquiries={(data ?? []) as AIInquiry[]}/></main>; }
