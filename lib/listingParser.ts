import type { PropertyInput } from "./types";

export type ListingDraft = Partial<PropertyInput> & { description: string; features: string[]; images: string[] };

const types = ["apartment", "house", "villa", "townhouse", "studio", "office", "land"];
const featureDictionary = [
  "parking", "balcony", "elevator", "garden", "pool", "furnished", "unfurnished",
  "sea view", "mountain view", "city view", "pet friendly", "gym", "security",
  "concierge", "terrace", "storage", "solar panels", "central heating", "air conditioning"
];

const fieldAliases = {
  title: ["title", "property title", "property name", "listing title", "name"],
  location: ["location", "area", "address", "city", "district", "neighborhood", "property location"],
  price: ["price", "asking price", "sale price", "rent", "budget", "amount"],
  type: ["type", "property type", "category", "listing type", "asset type"],
  bedrooms: ["bedrooms", "bedroom", "beds", "bed", "br"],
  bathrooms: ["bathrooms", "bathroom", "baths", "bath", "ba"],
  size: ["size", "area", "sq ft", "sqft", "square feet", "sqm", "m2", "m²"],
  features: ["features", "amenities", "facilities", "property features"],
  images: ["images", "image urls", "photos", "gallery", "media urls"],
  project: ["project", "project name", "development", "building"],
  completion: ["completion", "completion date", "delivery", "handover"],
  developer: ["developer", "developer name", "developed by"],
  availability: ["availability", "status", "listing status", "property status"]
} as const;

export function cleanListingNumber(value: unknown) {
  const cleaned = String(value ?? "").replace(/[$,\s]/g, "").trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizePropertyType(value: unknown) {
  const raw = String(value ?? "").toLowerCase().trim();
  if (!raw) return undefined;
  const singular = raw.replace(/s$/, "");
  return types.find(type => type === raw || type === singular || raw.includes(type));
}

export function normalizeListingStatus(value: unknown) {
  const raw = String(value ?? "").toLowerCase().trim();
  const map: Record<string, PropertyInput["availability"]> = {
    active: "available",
    published: "available",
    "available now": "available",
    unavailable: "inactive",
    "under offer": "reserved",
    leased: "rented",
    "under construction": "under_construction",
    "under-construction": "under_construction",
    "off plan": "under_construction",
    "off-plan": "under_construction"
  };
  const mapped = map[raw] ?? raw;
  return (["available", "booked", "reserved", "sold", "rented", "draft", "inactive", "pending", "under_construction"] as const).find(status => status === mapped);
}

const titleCase = (value: string) => value.replace(/\b\w/g, letter => letter.toUpperCase());
const normalizeText = (value: string) => value.replace(/\u00a0/g, " ").replace(/[“”]/g, "\"").replace(/[‘’]/g, "'").replace(/\r/g, "").trim();
const normalizeLabel = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function labeledValues(text: string) {
  const values = new Map<string, string>();
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([^:=—–-]{2,40})\s*(?::|=|—|–|-)\s*(.+?)\s*$/);
    if (match) values.set(normalizeLabel(match[1]), match[2].trim());
  }
  return values;
}

function labeled(map: Map<string, string>, aliases: readonly string[]) {
  for (const alias of aliases) {
    const value = map.get(normalizeLabel(alias));
    if (value) return value;
  }
  return undefined;
}

function valueFor(row: Record<string, unknown>, names: string[]) {
  const entry = Object.entries(row).find(([key]) => names.includes(key.toLowerCase().trim().replace(/[_-]/g, " ")));
  return entry?.[1];
}

function splitList(value: unknown) {
  return String(value ?? "").split(/[,;|]/).map(item => item.trim()).filter(Boolean);
}

function urlList(value: unknown) {
  return splitList(value).filter(item => {
    try { return ["http:", "https:"].includes(new URL(item).protocol); } catch { return false; }
  });
}

function uniqueFeatures(values: string[]) {
  const seen = new Set<string>();
  const features: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    features.push(value);
  }
  return features;
}

export function parseListingDescription(text: string): ListingDraft {
  const normalized = normalizeText(text);
  const lower = normalized.toLowerCase();
  const labels = labeledValues(normalized);
  const priceMatch = lower.match(/(?:price|asking price|asking|rent|budget|priced at|for)\s*(?:is|of|:|-)?\s*(?:usd|\$)?\s*([\d,]+(?:\.\d+)?)/i)
    ?? lower.match(/(?:usd|\$)\s*([\d,]+(?:\.\d+)?)/i);
  const bedMatch = lower.match(/(\d+)\s*[- ]?\s*(?:bedrooms?|beds?|br)\b/i);
  const bathMatch = lower.match(/(\d+(?:\.\d+)?)\s*[- ]?\s*(?:bathrooms?|baths?|ba)\b/i);
  const sizeMatch = lower.match(/([\d,]+(?:\.\d+)?)\s*(sq\.?\s*ft|square feet|sqm|m²|m2)\b/i);

  const propertyType = normalizePropertyType(labeled(labels, fieldAliases.type))
    ?? types.find(type => new RegExp(`\\b${type}s?\\b`, "i").test(lower));
  const location = labeled(labels, fieldAliases.location)
    ?? normalized.match(/\b(?:located|situated)\s+(?:in|at)\s+([^.;\n]+?)(?=\s+(?:with|featuring|for)\b|[.;\n]|$)/i)?.[1]?.trim()
    ?? normalized.match(/\b(?:in|at)\s+([^.;\n]+?)(?=\s+(?:with|for|featuring|under)\b|[.;\n]|$)/i)?.[1]?.trim();
  const explicitTitle = labeled(labels, fieldAliases.title);
  const projectName = labeled(labels, fieldAliases.project)
    ?? normalized.match(/\b(?:part of|within|at)\s+(?:the\s+)?([A-Z][A-Za-z0-9' -]+)\s+(?:project|development)/)?.[1]?.trim();
  const roiMatch = lower.match(/(?:roi|return(?: on investment)?|yield)\s*(?:of|is|:|-)?\s*(\d+(?:\.\d+)?)\s*%/i);
  const completionDate = labeled(labels, fieldAliases.completion) ?? null;
  const developerName = labeled(labels, fieldAliases.developer) ?? null;
  const availability = normalizeListingStatus(labeled(labels, fieldAliases.availability))
    ?? (["available", "reserved", "sold", "rented"] as const).find(value => lower.includes(value))
    ?? "available";
  const features = uniqueFeatures([
    ...splitList(labeled(labels, fieldAliases.features)),
    ...featureDictionary.filter(feature => lower.includes(feature))
  ]);
  const price = cleanListingNumber(labeled(labels, fieldAliases.price)) ?? (priceMatch ? cleanListingNumber(priceMatch[1]) : undefined);
  const bedrooms = cleanListingNumber(labeled(labels, fieldAliases.bedrooms)) ?? (bedMatch ? Number(bedMatch[1]) : propertyType === "studio" ? 0 : undefined);
  const bathrooms = cleanListingNumber(labeled(labels, fieldAliases.bathrooms)) ?? (bathMatch ? Number(bathMatch[1]) : propertyType === "land" ? 0 : undefined);
  const size = cleanListingNumber(labeled(labels, fieldAliases.size))
    ?? (sizeMatch ? Math.round((cleanListingNumber(sizeMatch[1]) ?? 0) * (/sqm|m²|m2/i.test(sizeMatch[2]) ? 10.7639 : 1)) : undefined);
  const title = explicitTitle ?? (propertyType && location
    ? `${bedrooms !== undefined && bedrooms > 0 ? `${bedrooms}-Bedroom ` : ""}${titleCase(propertyType)} in ${location}`
    : undefined);

  return {
    title, price, location, bedrooms, bathrooms, size, type: propertyType, description: normalized,
    features, images: urlList(labeled(labels, fieldAliases.images)), availability, project_name: projectName ?? null,
    investment_opportunity: /\b(?:investment|investor|roi|yield|return on investment)\b/i.test(lower),
    expected_roi: roiMatch ? Number(roiMatch[1]) : null,
    completion_date: completionDate,
    developer_name: developerName,
    show_developer_to_public: false
  };
}

export function missingFields(draft: ListingDraft): string[] {
  const missing: string[] = [];
  if (!draft.title) missing.push("title");
  if (!draft.price || draft.price <= 0) missing.push("price");
  if (!draft.location) missing.push("location");
  if (!draft.type) missing.push("property type");
  if (draft.bedrooms === undefined && draft.type !== "land") missing.push("bedrooms");
  if (draft.bathrooms === undefined && draft.type !== "land") missing.push("bathrooms");
  if (!draft.size || draft.size <= 0) missing.push("size");
  return missing;
}

export function parseSpreadsheetRow(row: Record<string, unknown>): ListingDraft {
  const description = String(valueFor(row, ["description", "details", "property description", "notes"]) ?? Object.values(row).filter(Boolean).join(". "));
  const parsed = parseListingDescription(description);
  const featuresValue = valueFor(row, ["features", "amenities", "property features"]);
  const imagesValue = valueFor(row, ["images", "image urls", "photos", "gallery"]);
  const direct: ListingDraft = {
    ...parsed,
    title: String(valueFor(row, ["title", "property title", "name"]) ?? parsed.title ?? "") || undefined,
    price: cleanListingNumber(valueFor(row, ["price", "rent", "asking price"])) ?? parsed.price,
    location: String(valueFor(row, ["location", "area", "address", "city"]) ?? parsed.location ?? "") || undefined,
    bedrooms: cleanListingNumber(valueFor(row, ["bedrooms", "beds", "bedroom"])) ?? parsed.bedrooms,
    bathrooms: cleanListingNumber(valueFor(row, ["bathrooms", "baths", "bathroom"])) ?? parsed.bathrooms,
    size: cleanListingNumber(valueFor(row, ["size", "square feet", "sq ft", "sqm"])) ?? parsed.size,
    type: normalizePropertyType(valueFor(row, ["type", "property type", "category"])) ?? parsed.type,
    description,
    features: featuresValue ? splitList(featuresValue) : parsed.features,
    images: imagesValue ? urlList(imagesValue) : parsed.images,
    availability: normalizeListingStatus(valueFor(row, ["availability", "status"])) ?? parsed.availability,
    project_name: String(valueFor(row, ["project", "project name", "development"]) ?? parsed.project_name ?? "") || null,
    investment_opportunity: ["yes", "true", "1", "investment"].includes(String(valueFor(row, ["investment", "investment opportunity", "for investors"]) ?? parsed.investment_opportunity).toLowerCase()),
    expected_roi: cleanListingNumber(valueFor(row, ["roi", "expected roi", "yield", "return"])) ?? parsed.expected_roi,
    completion_date: String(valueFor(row, ["completion", "completion date", "delivery", "handover"]) ?? parsed.completion_date ?? "") || null,
    developer_name: String(valueFor(row, ["developer", "developer name", "developed by"]) ?? parsed.developer_name ?? "") || null,
    show_developer_to_public: ["yes", "true", "1", "public"].includes(String(valueFor(row, ["show developer", "developer public", "public developer"]) ?? false).toLowerCase())
  };
  return direct;
}
