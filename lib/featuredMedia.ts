import type { FeaturedMedia, FeaturedMediaInput, FeaturedMediaPlacement } from "./types";

export const featuredMediaPlacements: { value: FeaturedMediaPlacement; label: string }[] = [
  { value: "homepage_hero", label: "Homepage hero" },
  { value: "homepage_strip", label: "Homepage strip" },
  { value: "gallery", label: "Gallery" },
  { value: "dashboard", label: "Dashboard" },
  { value: "listing_featured", label: "Listing featured" }
];

function isHttpsUrl(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function validateFeaturedMedia(input: FeaturedMediaInput) {
  if (!input.title.trim()) return "Enter a title.";
  if (input.title.trim().length > 160) return "Keep the title under 160 characters.";
  if (!isHttpsUrl(input.media_url.trim())) return "Media URL must be a valid HTTPS URL.";
  if (input.thumbnail_url && !isHttpsUrl(input.thumbnail_url.trim())) return "Thumbnail URL must be a valid HTTPS URL.";
  if (input.link_url) {
    const link = input.link_url.trim();
    const internalPath = link.startsWith("/") && !link.startsWith("//");
    if (!isHttpsUrl(link) && !internalPath) return "Link URL must be HTTPS or an internal path beginning with /.";
  }
  if (!Number.isInteger(input.sort_order)) return "Sort order must be a whole number.";
  if (input.starts_at && input.ends_at && new Date(input.ends_at).getTime() <= new Date(input.starts_at).getTime()) return "End time must be after the start time.";
  return null;
}

export function isFeaturedMediaActive(item: FeaturedMedia, now = new Date()) {
  if (!item.is_active) return false;
  if (item.starts_at && new Date(item.starts_at) > now) return false;
  if (item.ends_at && new Date(item.ends_at) <= now) return false;
  return true;
}

export function activeFeaturedMedia(items: FeaturedMedia[], now = new Date()) {
  return items.filter(item => isFeaturedMediaActive(item, now)).sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
}
