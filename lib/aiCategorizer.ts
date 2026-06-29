import type { WorkbenchCategory } from "./types";

export type Categorization = {
  category: WorkbenchCategory;
  confidence: number;
  source: "rule_based" | "openai";
  requires_followup: boolean;
  entities: { locations: string[]; listing_ids: string[] };
};

const rules: { category: WorkbenchCategory; patterns: RegExp[] }[] = [
  { category: "bulk_listing_import", patterns: [/\b(csv|excel|xlsx|spreadsheet|bulk import|many listings)\b/i] },
  { category: "showing_request", patterns: [/\b(viewing|showing|visit|tour|appointment)\b/i] },
  { category: "contact_request", patterns: [/\b(call me|contact me|whatsapp me|email me|speak to|reach me)\b/i] },
  { category: "listing_update", patterns: [/\b(update|edit|change|mark|sold|booked|reserved)\b.*\b(listing|property)\b/i] },
  { category: "listing_submission", patterns: [/\b(add|submit|create|publish|new)\b.*\b(listing|property)\b/i] },
  { category: "featured_media_request", patterns: [/\b(featured|advert|campaign|homepage hero|promotion)\b/i] },
  { category: "media_upload", patterns: [/\b(upload|photo|image|video|gallery|media)\b/i] },
  { category: "admin_task", patterns: [/\b(admin|user role|permission|assign agent|manage users)\b/i] },
  { category: "agent_support", patterns: [/\b(agent help|inventory help|client options|support agent)\b/i] },
  { category: "property_search_lead", patterns: [/\b(apartment|villa|house|studio|office|land|bedroom|property|listing)\b/i, /\b(budget|under|below|near|in|parking|pool|sea view)\b/i] },
  { category: "general_question", patterns: [/\b(how|what|why|where|when|can you)\b/i] }
];

export function categorizeRequest(message: string): Categorization {
  const text = message.trim();
  const matched = rules.find(rule => rule.patterns.some(pattern => pattern.test(text)));
  const listingIds = [...text.matchAll(/\b[0-9a-f]{8}-[0-9a-f-]{27,36}\b/gi)].map(match => match[0]);
  const locations = [...text.matchAll(/\b(?:in|near|around)\s+([a-z][a-z\s'-]{1,35})/gi)].map(match => match[1].trim().split(/\b(?:under|with|and|or)\b/i)[0].trim());
  const category = matched?.category ?? "unknown_needs_followup";
  return { category, confidence: matched ? 0.82 : 0.25, source: "rule_based", requires_followup: category === "unknown_needs_followup", entities: { locations, listing_ids: listingIds } };
}
