import "server-only";

import OpenAI from "openai";
import { categorizeRequest, type Categorization } from "./aiCategorizer";
import { parseListingDescription } from "./listingParser";
import type { WorkbenchCategory } from "./types";

export type AIListingExtraction = {
  title: string | null;
  description: string;
  price: number | null;
  price_status: string | null;
  property_type: string;
  listing_status: string;
  location: string;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  amenities: string[];
  media_urls: string[];
  video_urls: string[];
  project_name: string | null;
  completion_date: string | null;
  missing_required_fields: string[];
  skipped_optional_fields: string[];
  confidence_score: number;
  safe_to_import: boolean;
  review_reason: string;
};

export type AIResult<T> = { source: "openai"; data: T; warning?: string } | { source: "rule_based"; data: T; warning: string };

const listingSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: ["string", "null"] },
    description: { type: "string" },
    price: { type: ["number", "null"] },
    price_status: { type: ["string", "null"] },
    property_type: { type: "string" },
    listing_status: { type: "string" },
    location: { type: "string" },
    bedrooms: { type: ["number", "null"] },
    bathrooms: { type: ["number", "null"] },
    square_feet: { type: ["number", "null"] },
    amenities: { type: "array", items: { type: "string" } },
    media_urls: { type: "array", items: { type: "string" } },
    video_urls: { type: "array", items: { type: "string" } },
    project_name: { type: ["string", "null"] },
    completion_date: { type: ["string", "null"] },
    missing_required_fields: { type: "array", items: { type: "string" } },
    skipped_optional_fields: { type: "array", items: { type: "string" } },
    confidence_score: { type: "number" },
    safe_to_import: { type: "boolean" },
    review_reason: { type: "string" }
  },
  required: ["title","description","price","price_status","property_type","listing_status","location","bedrooms","bathrooms","square_feet","amenities","media_urls","video_urls","project_name","completion_date","missing_required_fields","skipped_optional_fields","confidence_score","safe_to_import","review_reason"]
} as const;

const categorizationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: { type: "string" },
    confidence: { type: "number" },
    requires_followup: { type: "boolean" },
    locations: { type: "array", items: { type: "string" } },
    listing_ids: { type: "array", items: { type: "string" } },
    reason: { type: "string" }
  },
  required: ["category","confidence","requires_followup","locations","listing_ids","reason"]
} as const;

function client() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function model() { return process.env.OPENAI_MODEL || "gpt-4o-mini"; }

function parseJson<T>(content: string | null | undefined) {
  if (!content) throw new Error("OpenAI returned an empty response.");
  return JSON.parse(content) as T;
}

function normalizeStatus(value: string | null | undefined, fileName = "") {
  const raw = `${value ?? ""}`.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (raw) {
    const map: Record<string, string> = {
      active: "available",
      availability: "available",
      available_now: "available",
      under_construction: "under_construction",
      off_plan: "under_construction",
      price_on_request: "available"
    };
    return map[raw] ?? raw;
  }
  const lowerFile = fileName.toLowerCase();
  if (lowerFile.includes("under-construction") || lowerFile.includes("under construction")) return "under_construction";
  if (lowerFile.includes("availability")) return "available";
  return "";
}

function fallbackExtraction(input: { text?: string; row?: Record<string, unknown>; fileName?: string; mediaUrls?: string[] }): AIListingExtraction {
  const sourceText = input.text || Object.entries(input.row ?? {}).map(([key, value]) => `${key}: ${String(value ?? "")}`).join("\n");
  const draft = parseListingDescription(sourceText);
  const requiredMissing = [
    !draft.title && !draft.project_name && !draft.location && "title, project, unit, or location",
    !draft.price && !draft.price_status && "price or price status",
    !draft.type && "property_type",
    !draft.availability && "listing_status"
  ].filter(Boolean) as string[];
  const priceStatus = draft.price ? null : draft.price_status ?? "price_on_request";
  return {
    title: draft.title ?? null,
    description: draft.description || sourceText,
    price: draft.price ?? null,
    price_status: priceStatus,
    property_type: draft.type ?? "property",
    listing_status: normalizeStatus(draft.availability, input.fileName) || "available",
    location: draft.location ?? draft.project_name ?? "",
    bedrooms: draft.bedrooms ?? null,
    bathrooms: draft.bathrooms ?? null,
    square_feet: draft.size ?? null,
    amenities: draft.features ?? [],
    media_urls: [...(draft.images ?? []), ...(input.mediaUrls ?? [])],
    video_urls: [],
    project_name: draft.project_name ?? null,
    completion_date: draft.completion_date ?? null,
    missing_required_fields: requiredMissing,
    skipped_optional_fields: ["AI unavailable; rule-based extractor used"],
    confidence_score: requiredMissing.length ? 0.45 : 0.68,
    safe_to_import: requiredMissing.length === 0,
    review_reason: requiredMissing.length ? `Rule fallback missing: ${requiredMissing.join(", ")}` : "Rule fallback produced a safe listing."
  };
}

export async function extractListing(input: { text?: string; row?: Record<string, unknown>; columns?: string[]; fileName?: string; mediaUrls?: string[] }): Promise<AIResult<AIListingExtraction>> {
  const openai = client();
  const fallback = fallbackExtraction(input);
  if (!openai) return { source: "rule_based", data: fallback, warning: "OPENAI_API_KEY is missing, so rule-based extraction was used." };
  try {
    const response = await openai.chat.completions.create({
      model: model(),
      temperature: 0.1,
      response_format: { type: "json_schema", json_schema: { name: "realtors_x_listing_extraction", strict: true, schema: listingSchema } },
      messages: [
        { role: "system", content: "You extract real estate listings for Realtors X. Return only valid structured JSON. Required fields are: title OR project OR unit OR location, price OR price_status, property_type, listing_status. Optional fields must never block import. Infer available from filenames containing availability, under_construction from under-construction/off-plan filenames, price_on_request when price is missing, and generate titles from project/unit/location when needed." },
        { role: "user", content: JSON.stringify({ file_name: input.fileName ?? null, columns: input.columns ?? [], row: input.row ?? null, pasted_text: input.text ?? null, media_urls: input.mediaUrls ?? [] }) }
      ]
    });
    const data = parseJson<AIListingExtraction>(response.choices[0]?.message?.content);
    return { source: "openai", data: { ...data, listing_status: normalizeStatus(data.listing_status, input.fileName) || data.listing_status } };
  } catch {
    return { source: "rule_based", data: fallback, warning: "OpenAI extraction failed, so rule-based extraction was used." };
  }
}

export async function categorizeMessage(message: string): Promise<AIResult<Categorization>> {
  const fallback = categorizeRequest(message);
  const openai = client();
  if (!openai) return { source: "rule_based", data: fallback, warning: "OPENAI_API_KEY is missing, so rule-based categorization was used." };
  try {
    const response = await openai.chat.completions.create({
      model: model(),
      temperature: 0,
      response_format: { type: "json_schema", json_schema: { name: "realtors_x_category", strict: true, schema: categorizationSchema } },
      messages: [
        { role: "system", content: "Categorize Realtors X workbench messages into one of: property_search_lead, contact_request, showing_request, listing_submission, bulk_listing_import, listing_update, featured_media_request, media_upload, admin_task, agent_support, general_question, unknown_needs_followup." },
        { role: "user", content: message }
      ]
    });
    const raw = parseJson<{ category: WorkbenchCategory; confidence: number; requires_followup: boolean; locations: string[]; listing_ids: string[]; reason: string }>(response.choices[0]?.message?.content);
    const data: Categorization = { category: raw.category, confidence: raw.confidence, source: "openai", requires_followup: raw.requires_followup, entities: { locations: raw.locations, listing_ids: raw.listing_ids } };
    return { source: "openai", data };
  } catch {
    return { source: "rule_based", data: fallback, warning: "OpenAI categorization failed, so rule-based categorization was used." };
  }
}

export async function explainListingMatch(input: { request: string; title: string; location: string; features: string[] }) {
  const openai = client();
  if (!openai) return null;
  try {
    const response = await openai.chat.completions.create({
      model: model(),
      temperature: 0.2,
      response_format: { type: "json_schema", json_schema: { name: "listing_match_explanation", strict: true, schema: { type: "object", additionalProperties: false, properties: { reasons: { type: "array", items: { type: "string" } } }, required: ["reasons"] } } },
      messages: [
        { role: "system", content: "Explain in short buyer-friendly phrases why this listing matches the request. Return 1-4 reasons." },
        { role: "user", content: JSON.stringify(input) }
      ]
    });
    return parseJson<{ reasons: string[] }>(response.choices[0]?.message?.content).reasons.slice(0, 4);
  } catch { return null; }
}
