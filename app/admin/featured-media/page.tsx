import { DashboardNav } from "@/components/DashboardNav";
import { FeaturedMediaManager } from "@/components/FeaturedMediaManager";
import { requireAdmin } from "@/lib/admin";
import type { FeaturedMedia } from "@/lib/types";

export default async function FeaturedMediaAdminPage() {
  const { supabase, user } = await requireAdmin("/admin/featured-media");
  const { data, error } = await supabase.from("featured_media").select("*").order("placement").order("sort_order").order("created_at");
  if (error) throw new Error("Featured media could not be loaded. Confirm that the latest Supabase migration has been applied.");
  return <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><DashboardNav isAdmin/><FeaturedMediaManager initialItems={(data ?? []) as FeaturedMedia[]} userId={user.id}/></main>;
}
