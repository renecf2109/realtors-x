import { activeFeaturedMedia } from "@/lib/featuredMedia";
import { createClient } from "@/lib/supabase/server";
import type { FeaturedMedia, FeaturedMediaPlacement } from "@/lib/types";

export async function getActiveFeaturedMedia(placements: FeaturedMediaPlacement[]) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("featured_media").select("*").in("placement", placements).eq("is_active", true).order("sort_order").order("created_at");
  // The website remains deployable while the migration is pending.
  if (error) return [];
  return activeFeaturedMedia((data ?? []) as FeaturedMedia[]);
}
