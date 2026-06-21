import type { ImportRowStatus } from "./types";

export type MappedListing = {
  title: string;
  price: number | null;
  price_status: string | null;
  location: string;
  type: string;
  availability: string;
  bedrooms: number;
  bathrooms: number;
  size: number;
  description: string;
  features: string[];
  images: string[];
  project_name: string | null;
};

export type VerifiedImportRow = { row_number: number; raw_data: Record<string, unknown>; mapped_data: Partial<MappedListing> & { id?: string }; row_status: ImportRowStatus; messages: string[]; duplicate_key: string | null };

const aliases: Record<string, string[]> = {
  title: ["title","listing title","property title","name","unit name"],
  location: ["location","address","area","city","district","neighborhood","property location"],
  price: ["price","asking price","sale price","rent","amount","usd"],
  price_status: ["price status","pricing","price on request","poa"],
  type: ["type","property type","listing type","category","asset type"],
  availability: ["status","listing status","availability","property status"],
  bedrooms: ["bedrooms","bedroom","beds","bed","br"],
  bathrooms: ["bathrooms","bathroom","baths","bath","ba"],
  size: ["size","area sqft","sq ft","sqft","square feet","sqm","m2"],
  description: ["description","details","notes","property description","remarks"],
  features: ["features","amenities","property features","facilities"],
  images: ["images","image urls","photos","gallery","media urls"],
  project_name: ["project","project name","development","building"]
};
const allowedStatuses = ["available","booked","reserved","sold","rented","draft","inactive","pending"];

function normalizeKey(value: string) { return value.toLowerCase().trim().replace(/[_-]+/g, " ").replace(/\s+/g, " "); }
function valueFor(row: Record<string, unknown>, field: keyof typeof aliases) { const names = aliases[field]; return Object.entries(row).find(([key]) => names.includes(normalizeKey(key)))?.[1]; }
function text(value: unknown) { return value === null || value === undefined ? "" : String(value).trim(); }
function number(value: unknown) { const cleaned = text(value).replace(/[$,\s]/g, ""); if (!cleaned) return null; const parsed = Number(cleaned); return Number.isFinite(parsed) ? parsed : null; }
function list(value: unknown) { return text(value).split(/[,;|]/).map(item => item.trim()).filter(Boolean); }
function urls(value: unknown) { return list(value).filter(item => { try { return new URL(item).protocol === "https:"; } catch { return false; } }); }
function status(value: unknown) { const raw = text(value).toLowerCase(); const map: Record<string,string> = { active: "available", published: "available", unavailable: "inactive", "under offer": "reserved" }; return map[raw] ?? raw; }

export function verifyImportRow(row: Record<string, unknown>, rowNumber: number): VerifiedImportRow {
  const location = text(valueFor(row, "location"));
  const sourceTitle = text(valueFor(row, "title"));
  const propertyType = text(valueFor(row, "type")).toLowerCase();
  const listingStatus = status(valueFor(row, "availability"));
  const rawPrice = valueFor(row, "price");
  const parsedPrice = number(rawPrice);
  const priceStatus = text(valueFor(row, "price_status")) || (text(rawPrice) && parsedPrice === null ? text(rawPrice) : "");
  const mapped: Partial<MappedListing> = {
    title: sourceTitle || (location ? `${propertyType || "Property"} in ${location}` : ""), location, type: propertyType,
    price: parsedPrice, price_status: priceStatus || null, availability: listingStatus,
    bedrooms: number(valueFor(row, "bedrooms")) ?? 0, bathrooms: number(valueFor(row, "bathrooms")) ?? 0,
    size: number(valueFor(row, "size")) ?? 0, description: text(valueFor(row, "description")),
    features: list(valueFor(row, "features")), images: urls(valueFor(row, "images")), project_name: text(valueFor(row, "project_name")) || null
  };
  const missing: string[] = [];
  if (!sourceTitle && !location) missing.push("title or address/location");
  if (parsedPrice === null && !priceStatus) missing.push("price or price status");
  if (!propertyType) missing.push("property type");
  if (!listingStatus) missing.push("listing status");
  if (missing.length) return { row_number: rowNumber, raw_data: row, mapped_data: mapped, row_status: "required_missing", messages: missing.map(field => `Required missing: ${field}`), duplicate_key: null };
  if (!allowedStatuses.includes(listingStatus)) return { row_number: rowNumber, raw_data: row, mapped_data: mapped, row_status: "needs_review", messages: [`Review listing status: ${listingStatus}`], duplicate_key: null };
  const missingOptional = [!valueFor(row,"bedrooms")&&"bedrooms",!valueFor(row,"bathrooms")&&"bathrooms",!valueFor(row,"size")&&"size",!valueFor(row,"description")&&"description",!valueFor(row,"features")&&"features",!valueFor(row,"images")&&"media"].filter(Boolean) as string[];
  const duplicateKey = [mapped.title, location, parsedPrice ?? priceStatus, propertyType].map(value => String(value).toLowerCase()).join("|");
  return { row_number: rowNumber, raw_data: row, mapped_data: mapped, row_status: missingOptional.length ? "optional_skipped" : "imported", messages: missingOptional.map(field => `Optional skipped: ${field}`), duplicate_key: duplicateKey };
}

export function markDuplicate(row: VerifiedImportRow): VerifiedImportRow { return { ...row, row_status: "duplicate_skipped", messages: [...row.messages, "Duplicate listing skipped"] }; }
