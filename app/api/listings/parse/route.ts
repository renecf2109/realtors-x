import { NextResponse } from "next/server";
import { extractListing } from "@/lib/aiWorkbench";
import { missingFields, parseListingDescription } from "@/lib/listingParser";
import type { PropertyInput } from "@/lib/types";

const allowedStatuses = ["available","booked","reserved","sold","rented","draft","inactive","pending","under_construction"] as const;
function safeStatus(value: string): PropertyInput["availability"] { return allowedStatuses.find(status => status === value) ?? "available"; }

export async function POST(request: Request) {
  try {
    const { description } = await request.json();
    if (typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "A property description is required." }, { status: 400 });
    }
    const ai = await extractListing({ text: description });
    const draft = ai.source === "openai" ? {
      title: ai.data.title ?? undefined,
      price: ai.data.price ?? undefined,
      price_status: ai.data.price_status,
      location: ai.data.location || undefined,
      bedrooms: ai.data.bedrooms ?? undefined,
      bathrooms: ai.data.bathrooms ?? undefined,
      size: ai.data.square_feet ?? undefined,
      type: ai.data.property_type || undefined,
      description: ai.data.description,
      features: ai.data.amenities,
      images: ai.data.media_urls,
      availability: safeStatus(ai.data.listing_status),
      project_name: ai.data.project_name,
      investment_opportunity: /\b(?:investment|investor|roi|yield)\b/i.test(description),
      expected_roi: null,
      completion_date: ai.data.completion_date,
      developer_name: null,
      show_developer_to_public: false
    } : parseListingDescription(description);
    return NextResponse.json({ draft, missing: ai.source === "openai" ? ai.data.missing_required_fields : missingFields(draft), ai_source: ai.source, warning: ai.warning ?? null, review_reason: ai.data.review_reason });
  } catch {
    return NextResponse.json({ error: "The description could not be analyzed." }, { status: 500 });
  }
}
