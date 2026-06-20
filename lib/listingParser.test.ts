import { describe, expect, it } from "vitest";
import { missingFields, parseListingDescription } from "./listingParser";

describe("listing description parser", () => {
  it("fills every field from the Marina Heights example", () => {
    const draft = parseListingDescription(`Title: Marina Heights Apartment
Project: Marina Heights
Location: Beirut Waterfront
Price: $250000

Modern 2-bedroom apartment with 2 bathrooms and 1400 sq ft. Includes parking, balcony, gym, security, and sea view. This is an investment opportunity with expected ROI of 7.5%.

Completion: Q4 2027
Available now.`);

    expect(draft).toMatchObject({
      title: "Marina Heights Apartment",
      project_name: "Marina Heights",
      location: "Beirut Waterfront",
      price: 250000,
      type: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      size: 1400,
      availability: "available",
      investment_opportunity: true,
      expected_roi: 7.5,
      completion_date: "Q4 2027"
    });
    expect(draft.features).toEqual(expect.arrayContaining(["parking", "balcony", "gym", "security", "sea view"]));
    expect(missingFields(draft)).toEqual([]);
  });

  it("generates a title and converts square meters", () => {
    const draft = parseListingDescription("Luxury 3-bedroom villa located in Achrafieh with pool and parking, 200 sqm, 3 bathrooms, priced at $900000.");
    expect(draft.title).toBe("3-Bedroom Villa in Achrafieh");
    expect(draft.size).toBe(2153);
    expect(draft.price).toBe(900000);
    expect(draft.features).toEqual(expect.arrayContaining(["pool", "parking"]));
  });

  it("separates a location from following features and asks only for missing data", () => {
    const draft = parseListingDescription("Apartment in Hamra with balcony.");
    expect(draft.location).toBe("Hamra");
    expect(draft.title).toBe("Apartment in Hamra");
    expect(draft.features).toContain("balcony");
    expect(missingFields(draft)).toEqual(["price", "bedrooms", "bathrooms", "size"]);
  });
});
