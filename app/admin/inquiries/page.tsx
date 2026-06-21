import { DashboardNav } from "@/components/DashboardNav";
import { InquiryList } from "@/components/InquiryList";
import { requireAdmin } from "@/lib/admin";
import type { AIInquiry } from "@/lib/types";

export default async function AdminInquiriesPage() { const { supabase } = await requireAdmin("/admin/inquiries"); const { data } = await supabase.from("ai_inquiries").select("*").order("created_at",{ascending:false}); return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav isAdmin/><InquiryList initialInquiries={(data ?? []) as AIInquiry[]} admin/></main>; }
