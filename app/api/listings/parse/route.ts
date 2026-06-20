import { NextResponse } from "next/server";
import { missingFields, parseListingDescription } from "@/lib/listingParser";

export async function POST(request: Request) {
  try {
    const { description } = await request.json();
    if (typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "A property description is required." }, { status: 400 });
    }
    const draft = parseListingDescription(description);
    return NextResponse.json({ draft, missing: missingFields(draft) });
  } catch {
    return NextResponse.json({ error: "The description could not be analyzed." }, { status: 500 });
  }
}
