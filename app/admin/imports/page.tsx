import { DashboardNav } from "@/components/DashboardNav";
import { ImportHistory } from "@/components/ImportHistory";
import { requireAdmin } from "@/lib/admin";
import type { ListingImportSummary } from "@/lib/types";

export default async function AdminImportsPage() { const { supabase } = await requireAdmin("/admin/imports"); const { data } = await supabase.from("listing_imports").select("*").order("created_at",{ascending:false}); return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav isAdmin/><ImportHistory imports={(data ?? []) as ListingImportSummary[]} admin/></main>; }
