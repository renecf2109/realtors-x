import type { Property } from "./types";

export function formatListingPrice(listing: Pick<Property, "price" | "price_status">) {
  if (listing.price !== null && listing.price !== undefined) return `$${Number(listing.price).toLocaleString()}`;
  return listing.price_status?.trim() || "Price on request";
}
