import type { Property } from "./types";

export type SearchIntent = {
  maxPrice?: number; minPrice?: number; minBeds?: number; minBaths?: number;
  minSize?: number; maxSize?: number; types: string[]; location?: string;
  features: string[]; statuses: string[];
};

const propertyTypes = ["apartment", "house", "villa", "townhouse", "studio", "office", "land"];
const featureDictionary = ["parking", "balcony", "garden", "pool", "furnished", "unfurnished", "sea view", "mountain view", "city view", "pet friendly", "elevator", "gym", "security", "concierge", "terrace", "storage", "solar panels", "air conditioning"];
const stopLocations = /\b(?:under|below|above|over|between|with|having|featuring|from|priced|price|and|or|that|at least|larger|smaller)\b/i;

function amount(match: RegExpMatchArray | null) {
  if (!match) return undefined;
  return Number(match[1]) * (match[2] === "k" ? 1000 : match[2] === "m" ? 1000000 : 1);
}

export function parseSearch(message: string): SearchIntent {
  const q = message.toLowerCase().replace(/,/g, "");
  const maxPrice = amount(q.match(/(?:under|below|max(?:imum)?|budget(?: of)?|up to)\s*\$?([\d.]+)\s*(k|m)?/));
  const minPrice = amount(q.match(/(?:above|over|min(?:imum)?|from|at least)\s*\$?([\d.]+)\s*(k|m)?/));
  const beds = q.match(/(\d+)\s*[- ]?\s*(?:bed|bedroom)/);
  const baths = q.match(/(\d+(?:\.\d+)?)\s*[- ]?\s*(?:bath|bathroom)/);
  const minSizeMatch = q.match(/(?:above|over|from|at least|larger than)\s*([\d.]+)\s*(?:sq\.?\s*ft|square feet|sqm|m²|m2)/);
  const maxSizeMatch = q.match(/(?:under|below|up to|smaller than)\s*([\d.]+)\s*(?:sq\.?\s*ft|square feet|sqm|m²|m2)/);
  const types = propertyTypes.filter(type => new RegExp(`\\b${type}s?\\b`).test(q));
  const locationRaw = q.match(/(?:in|near|around|at)\s+([a-z][a-z\s'-]{1,40})/)?.[1]?.trim();
  const location = locationRaw?.split(stopLocations)[0]?.trim();
  const features = featureDictionary.filter(feature => q.includes(feature));
  const statuses = ["available", "booked", "reserved", "sold", "rented"].filter(status => q.includes(status));
  return {
    maxPrice, minPrice, minBeds: beds ? Number(beds[1]) : undefined, minBaths: baths ? Number(baths[1]) : undefined,
    minSize: minSizeMatch ? Number(minSizeMatch[1]) : undefined,
    maxSize: maxSizeMatch ? Number(maxSizeMatch[1]) : undefined,
    types, location: location && location.length > 1 ? location : undefined, features, statuses
  };
}

export function filterProperties(properties: Property[], intent: SearchIntent) {
  return properties.filter(property => {
    if (intent.maxPrice !== undefined && (property.price === null || Number(property.price) > intent.maxPrice)) return false;
    if (intent.minPrice !== undefined && (property.price === null || Number(property.price) < intent.minPrice)) return false;
    if (intent.minBeds !== undefined && Number(property.bedrooms) < intent.minBeds) return false;
    if (intent.minBaths !== undefined && Number(property.bathrooms) < intent.minBaths) return false;
    if (intent.minSize !== undefined && Number(property.size) < intent.minSize) return false;
    if (intent.maxSize !== undefined && Number(property.size) > intent.maxSize) return false;
    if (intent.types.length && !intent.types.includes(property.type.toLowerCase())) return false;
    if (intent.location && !property.location.toLowerCase().includes(intent.location)) return false;
    if (intent.statuses.length && !intent.statuses.includes(property.availability)) return false;
    const haystack = `${property.description} ${property.features.join(" ")}`.toLowerCase();
    if (intent.features.some(feature => !haystack.includes(feature))) return false;
    return true;
  }).sort((a, b) => (a.price === null ? Number.MAX_SAFE_INTEGER : Number(a.price)) - (b.price === null ? Number.MAX_SAFE_INTEGER : Number(b.price)));
}

export function rankProperties(properties: Property[], intent: SearchIntent) {
  return filterProperties(properties, intent).slice(0, 8).map(property => {
    const reasons = [
      intent.maxPrice !== undefined ? "within budget" : "",
      intent.location ? `in ${property.location}` : "",
      ...intent.features,
      intent.minBeds !== undefined ? `${property.bedrooms} bedrooms` : ""
    ].filter(Boolean);
    return { property, score: reasons.length, reasons };
  });
}
