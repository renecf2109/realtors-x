import type { ImportRowStatus } from "./types";
import type { AIListingExtraction } from "./aiWorkbench";
import { cleanListingNumber, normalizeListingStatus, normalizePropertyType, parseListingDescription } from "./listingParser";

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
  videos: string[];
  project_name: string | null;
  completion_date: string | null;
};

export type ImportContext = { fileName?: string };
export type VerifiedImportRow = { row_number: number; raw_data: Record<string, unknown>; mapped_data: Partial<MappedListing> & { id?: string }; row_status: ImportRowStatus; messages: string[]; duplicate_key: string | null };

const aliases = {
  title: ["title","listing title","property title","name"],
  project: ["project","project name","development","building","tower"],
  unit: ["unit","unit number","unit no","reference","ref"],
  location: ["location","address","city","district","neighborhood","property location"],
  price: ["price","asking price","sale price","selling price","rent","amount","usd"],
  price_status: ["price status","pricing","price on request","poa"],
  type: ["type","property type","unit type","listing type","category","asset type","layout"],
  availability: ["status","listing status","availability","property status"],
  bedrooms: ["bedrooms","bedroom","beds","bed","br"],
  bathrooms: ["bathrooms","bathroom","baths","bath","ba"],
  size: ["size","area","area sqft","sq ft","sqft","square feet","sqm","m2"],
  floor: ["floor","level"],
  view: ["view","views"],
  handover: ["handover","delivery","completion","completion date"],
  payment_plan: ["payment plan","payment","payment terms","plan"],
  features: ["features","amenities","property features","facilities"],
  parking: ["parking","parking spots","car park"],
  images: ["images","image urls","photos","photo","gallery","media urls"],
  videos: ["video","videos","tour","virtual tour","video url"]
} as const;

const allowedStatuses = ["available","booked","reserved","sold","rented","draft","inactive","pending","under_construction"];

function normalizeKey(value: string) { return value.toLowerCase().trim().replace(/[_/-]+/g, " ").replace(/\s+/g, " "); }
function text(value: unknown) { return value === null || value === undefined ? "" : String(value).trim(); }
function number(value: unknown) { return cleanListingNumber(value) ?? null; }
function list(value: unknown) { return text(value).split(/[,;|]/).map(item => item.trim()).filter(Boolean); }
function urls(value: unknown) { return list(value).filter(item => { try { return ["http:", "https:"].includes(new URL(item).protocol); } catch { return false; } }); }
function valueFor(row: Record<string, unknown>, field: keyof typeof aliases) {
  const normalized = Object.entries(row).map(([key, value]) => [normalizeKey(key), value] as const);
  const names = aliases[field].map(normalizeKey);
  return normalized.find(([key]) => names.includes(key))?.[1]
    ?? normalized.find(([key]) => key.length > 3 && names.some(name => name.length > 3 && (key.includes(name) || name.includes(key))))?.[1];
}

function inferredStatus(rawStatus: string, fileName: string, description: string) {
  const explicit = normalizeListingStatus(rawStatus);
  if (explicit) return explicit;
  const source = `${fileName} ${description}`.toLowerCase();
  if (/\bunder[\s_-]*construction\b|\boff[\s_-]*plan\b|\bconstruction\b/.test(source)) return "under_construction";
  if (/\bavailability\b|\bavailable\b|\bready\b/.test(source)) return "available";
  return rawStatus ? rawStatus.toLowerCase().replace(/\s+/g, "_") : "";
}

function inferType(raw: unknown, bedrooms: number | null) {
  const normalized = normalizePropertyType(raw);
  if (normalized) return normalized;
  const value = text(raw).toLowerCase();
  if (/\b\d+\s*br\b|\b\d+\s*bed\b/.test(value) || bedrooms !== null) return "apartment";
  if (/\bstudio\b/.test(value)) return "studio";
  return "property";
}

function buildTitle(parts: { sourceTitle: string; project: string; unit: string; propertyType: string; location: string }) {
  if (parts.sourceTitle) return parts.sourceTitle;
  const unitPart = parts.unit ? `Unit ${parts.unit}` : "";
  const base = [parts.project, unitPart].filter(Boolean).join(" ");
  if (base) return base;
  if (parts.location) return `${parts.propertyType || "Property"} in ${parts.location}`;
  return "";
}

function compactDescription(row: Record<string, unknown>, fallback: string) {
  const details = Object.entries(row)
    .filter(([, value]) => text(value))
    .map(([key, value]) => `${key}: ${text(value)}`)
    .join("\n");
  return fallback || details;
}

export function verifyImportRow(row: Record<string, unknown>, rowNumber: number, context: ImportContext = {}): VerifiedImportRow {
  const fileName = context.fileName ?? "";
  const rowText = Object.values(row).filter(Boolean).join("\n");
  const explicitDescription = text(valueFor(row, "title")) ? "" : text(valueFor(row, "features"));
  const descriptionSource = text((row as Record<string, unknown>).Description) || text((row as Record<string, unknown>).description) || rowText;
  const parsed = parseListingDescription(descriptionSource);
  const project = text(valueFor(row, "project")) || parsed.project_name || "";
  const unit = text(valueFor(row, "unit"));
  const location = text(valueFor(row, "location")) || parsed.location || project || unit || "";
  const sourceTitle = text(valueFor(row, "title")) || parsed.title || "";
  const bedrooms = number(valueFor(row, "bedrooms")) ?? parsed.bedrooms ?? null;
  const propertyType = inferType(valueFor(row, "type"), bedrooms);
  const listingStatus = inferredStatus(text(valueFor(row, "availability")), fileName, descriptionSource);
  const rawPrice = valueFor(row, "price");
  const parsedPrice = number(rawPrice) ?? parsed.price ?? null;
  const priceStatus = text(valueFor(row, "price_status")) || (text(rawPrice) && parsedPrice === null ? text(rawPrice) : "") || (parsedPrice === null ? "price_on_request" : "");
  const view = text(valueFor(row, "view"));
  const floor = text(valueFor(row, "floor"));
  const paymentPlan = text(valueFor(row, "payment_plan"));
  const handover = text(valueFor(row, "handover")) || parsed.completion_date || null;
  const parking = text(valueFor(row, "parking"));
  const featureValues = [...list(valueFor(row, "features")), ...parsed.features, view && `${view} view`, parking && "parking"].filter(Boolean) as string[];
  const features = Array.from(new Map(featureValues.map(feature => [feature.toLowerCase(), feature])).values());
  const title = buildTitle({ sourceTitle, project, unit, propertyType, location });
  const description = compactDescription(row, explicitDescription || parsed.description);
  const mapped: Partial<MappedListing> = {
    title,
    price: parsedPrice,
    price_status: priceStatus || null,
    location,
    type: propertyType,
    availability: listingStatus,
    bedrooms: bedrooms ?? 0,
    bathrooms: number(valueFor(row, "bathrooms")) ?? parsed.bathrooms ?? 0,
    size: number(valueFor(row, "size")) ?? parsed.size ?? 0,
    description: [description, floor && `Floor: ${floor}`, view && `View: ${view}`, paymentPlan && `Payment plan: ${paymentPlan}`, handover && `Handover: ${handover}`].filter(Boolean).join("\n"),
    features,
    images: urls(valueFor(row, "images")),
    videos: urls(valueFor(row, "videos")),
    project_name: project || null,
    completion_date: handover
  };

  const missing: string[] = [];
  if (!sourceTitle && !project && !unit && !location) missing.push("title, project, unit, or location");
  if (!mapped.price && !mapped.price_status) missing.push("price or price status");
  if (!propertyType) missing.push("property type");
  if (!listingStatus) missing.push("listing status");
  if (missing.length) return { row_number: rowNumber, raw_data: row, mapped_data: mapped, row_status: "required_missing", messages: missing.map(field => `Required missing: ${field}`), duplicate_key: null };
  if (!allowedStatuses.includes(listingStatus)) return { row_number: rowNumber, raw_data: row, mapped_data: mapped, row_status: "needs_review", messages: [`Review listing status: ${listingStatus}`], duplicate_key: null };

  const messages = [
    !text(rawPrice) && parsedPrice === null && "Inferred price status: price_on_request",
    !text(valueFor(row, "availability")) && listingStatus && `Inferred status from file/content: ${listingStatus}`,
    !text(valueFor(row, "type")) && "Inferred property type: property",
    !text(valueFor(row, "bedrooms")) && "Optional skipped: bedrooms",
    !text(valueFor(row, "bathrooms")) && "Optional skipped: bathrooms",
    !text(valueFor(row, "size")) && "Optional skipped: size",
    !features.length && "Optional skipped: amenities",
    !mapped.images?.length && "Optional skipped: images",
    !mapped.videos?.length && "Optional skipped: videos"
  ].filter(Boolean) as string[];
  const duplicateKey = [mapped.title, mapped.location, mapped.price ?? mapped.price_status, mapped.type].map(value => String(value ?? "").toLowerCase()).join("|");
  return { row_number: rowNumber, raw_data: row, mapped_data: mapped, row_status: messages.length ? "optional_skipped" : "imported", messages, duplicate_key: duplicateKey };
}

export function markDuplicate(row: VerifiedImportRow): VerifiedImportRow { return { ...row, row_status: "duplicate_skipped", messages: [...row.messages, "Duplicate listing skipped"] }; }

export function verifiedRowFromAI(row: Record<string, unknown>, rowNumber: number, ai: AIListingExtraction, source: "openai" | "rule_based", warning?: string): VerifiedImportRow {
  const missing = ai.missing_required_fields.filter(Boolean);
  const status = ai.listing_status || "";
  const type = ai.property_type || "property";
  const title = ai.title || [ai.project_name, ai.location, type].filter(Boolean).join(" ") || "";
  const mapped: Partial<MappedListing> = {
    title,
    price: ai.price,
    price_status: ai.price_status || (ai.price === null ? "price_on_request" : null),
    location: ai.location || ai.project_name || title,
    type,
    availability: status,
    bedrooms: ai.bedrooms ?? 0,
    bathrooms: ai.bathrooms ?? 0,
    size: ai.square_feet ?? 0,
    description: ai.description,
    features: ai.amenities,
    images: ai.media_urls,
    videos: ai.video_urls,
    project_name: ai.project_name,
    completion_date: ai.completion_date
  };
  const messages = [
    source === "openai" ? `AI confidence: ${Math.round(ai.confidence_score * 100)}%` : warning,
    ai.review_reason && `AI: ${ai.review_reason}`,
    ...missing.map(field => `Required missing: ${field}`),
    ...ai.skipped_optional_fields.map(field => `Optional skipped: ${field}`)
  ].filter(Boolean) as string[];
  if (!ai.safe_to_import || missing.length) return { row_number: rowNumber, raw_data: row, mapped_data: mapped, row_status: "required_missing", messages, duplicate_key: null };
  if (!allowedStatuses.includes(status)) return { row_number: rowNumber, raw_data: row, mapped_data: mapped, row_status: "needs_review", messages: [...messages, `Review listing status: ${status}`], duplicate_key: null };
  const duplicateKey = [mapped.title, mapped.location, mapped.price ?? mapped.price_status, mapped.type].map(value => String(value ?? "").toLowerCase()).join("|");
  return { row_number: rowNumber, raw_data: row, mapped_data: mapped, row_status: messages.length ? "optional_skipped" : "imported", messages, duplicate_key: duplicateKey };
}
