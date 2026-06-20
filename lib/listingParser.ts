import type { PropertyInput } from "./types";

export type ListingDraft = Partial<PropertyInput> & { description: string; features: string[]; images: string[] };

const types = ["apartment", "house", "villa", "townhouse", "studio", "office", "land"];
const featureDictionary = [
  "parking", "balcony", "elevator", "garden", "pool", "furnished", "unfurnished",
  "sea view", "mountain view", "city view", "pet friendly", "gym", "security",
  "concierge", "terrace", "storage", "solar panels", "central heating", "air conditioning"
];

const cleanNumber = (value: string) => Number(value.replace(/,/g, ""));
const titleCase = (value: string) => value.replace(/\b\w/g, letter => letter.toUpperCase());

export function parseListingDescription(text: string): ListingDraft {
  const normalized = text.replace(/\r/g, "").trim();
  const lower = normalized.toLowerCase();
  const labeled = (label: string) => normalized.match(new RegExp(`(?:^|\\n)\\s*(?:${label})\\s*[:=-]\\s*([^\\n]+)`, "i"))?.[1]?.trim();
  const priceMatch = lower.match(/(?:price|asking price|asking|rent|budget|priced at|for)\s*(?:is|of|:|-)?\s*(?:usd|\$)?\s*([\d,]+(?:\.\d+)?)/i)
    ?? lower.match(/(?:usd|\$)\s*([\d,]+(?:\.\d+)?)/i);
  const bedMatch = lower.match(/(\d+)\s*[- ]?\s*(?:bedrooms?|beds?|br)\b/i);
  const bathMatch = lower.match(/(\d+(?:\.\d+)?)\s*[- ]?\s*(?:bathrooms?|baths?|ba)\b/i);
  const sizeMatch = lower.match(/([\d,]+(?:\.\d+)?)\s*(sq\.?\s*ft|square feet|sqm|m²|m2)\b/i);
  const propertyType = types.find(type => new RegExp(`\\b${type}\\b`, "i").test(lower));
  const location = labeled("location|area|address")
    ?? normalized.match(/\b(?:located|situated)\s+(?:in|at)\s+([^.;\n]+?)(?=\s+(?:with|featuring|for)\b|[.;\n]|$)/i)?.[1]?.trim()
    ?? normalized.match(/\b(?:in|at)\s+([^.;\n]+?)(?=\s+(?:with|for|featuring|under)\b|[.;\n]|$)/i)?.[1]?.trim();
  const explicitTitle = labeled("title|property name");
  const projectName = labeled("project|project name|development")
    ?? normalized.match(/\b(?:part of|within|at)\s+(?:the\s+)?([A-Z][A-Za-z0-9' -]+)\s+(?:project|development)/)?.[1]?.trim();
  const roiMatch = lower.match(/(?:roi|return(?: on investment)?|yield)\s*(?:of|is|:|-)?\s*(\d+(?:\.\d+)?)\s*%/i);
  const completionDate = labeled("completion|delivery|handover") ?? null;
  const developerName = labeled("developer|developer name|developed by") ?? null;
  const availability = (["available", "reserved", "sold", "rented"] as const).find(value => lower.includes(value)) ?? "available";
  const features = featureDictionary.filter(feature => lower.includes(feature));
  const price = priceMatch ? cleanNumber(priceMatch[1]) : undefined;
  const bedrooms = bedMatch ? Number(bedMatch[1]) : propertyType === "studio" ? 0 : undefined;
  const bathrooms = bathMatch ? Number(bathMatch[1]) : propertyType === "land" ? 0 : undefined;
  const size = sizeMatch ? Math.round(cleanNumber(sizeMatch[1]) * (/sqm|m²|m2/i.test(sizeMatch[2]) ? 10.7639 : 1)) : undefined;
  const title = explicitTitle ?? (propertyType && location
    ? `${bedrooms !== undefined && bedrooms > 0 ? `${bedrooms}-Bedroom ` : ""}${titleCase(propertyType)} in ${location}`
    : undefined);

  return {
    title, price, location, bedrooms, bathrooms, size, type: propertyType, description: normalized,
    features, images: [], availability, project_name: projectName ?? null,
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

function valueFor(row: Record<string, unknown>, names: string[]) {
  const entry = Object.entries(row).find(([key]) => names.includes(key.toLowerCase().trim().replace(/[_-]/g, " ")));
  return entry?.[1];
}

export function parseSpreadsheetRow(row: Record<string, unknown>): ListingDraft {
  const description = String(valueFor(row, ["description", "details", "property description", "notes"]) ?? Object.values(row).filter(Boolean).join(". "));
  const parsed = parseListingDescription(description);
  const featuresValue = valueFor(row, ["features", "amenities", "property features"]);
  const imagesValue = valueFor(row, ["images", "image urls", "photos", "gallery"]);
  const direct: ListingDraft = {
    ...parsed,
    title: String(valueFor(row, ["title", "property title", "name"]) ?? parsed.title ?? "") || undefined,
    price: Number(valueFor(row, ["price", "rent", "asking price"]) ?? parsed.price) || undefined,
    location: String(valueFor(row, ["location", "area", "address", "city"]) ?? parsed.location ?? "") || undefined,
    bedrooms: Number(valueFor(row, ["bedrooms", "beds", "bedroom"]) ?? parsed.bedrooms),
    bathrooms: Number(valueFor(row, ["bathrooms", "baths", "bathroom"]) ?? parsed.bathrooms),
    size: Number(valueFor(row, ["size", "square feet", "sq ft", "sqm"]) ?? parsed.size) || undefined,
    type: String(valueFor(row, ["type", "property type", "category"]) ?? parsed.type ?? "").toLowerCase() || undefined,
    description,
    features: featuresValue ? String(featuresValue).split(/[,;|]/).map(item => item.trim()).filter(Boolean) : parsed.features,
    images: imagesValue ? String(imagesValue).split(/[,;|]/).map(item => item.trim()).filter(item => item.startsWith("http")) : [],
    availability: (String(valueFor(row, ["availability", "status"]) ?? parsed.availability).toLowerCase() as PropertyInput["availability"])
    ,project_name: String(valueFor(row, ["project", "project name", "development"]) ?? parsed.project_name ?? "") || null
    ,investment_opportunity: ["yes", "true", "1", "investment"].includes(String(valueFor(row, ["investment", "investment opportunity", "for investors"]) ?? parsed.investment_opportunity).toLowerCase())
    ,expected_roi: Number(valueFor(row, ["roi", "expected roi", "yield", "return"]) ?? parsed.expected_roi) || null
    ,completion_date: String(valueFor(row, ["completion", "completion date", "delivery", "handover"]) ?? parsed.completion_date ?? "") || null
    ,developer_name: String(valueFor(row, ["developer", "developer name", "developed by"]) ?? parsed.developer_name ?? "") || null
    ,show_developer_to_public: ["yes", "true", "1", "public"].includes(String(valueFor(row, ["show developer", "developer public", "public developer"]) ?? false).toLowerCase())
  };
  if (!Number.isFinite(direct.bedrooms)) direct.bedrooms = undefined;
  if (!Number.isFinite(direct.bathrooms)) direct.bathrooms = undefined;
  return direct;
}
