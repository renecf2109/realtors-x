import { describe, expect, it } from "vitest";
import { markDuplicate, verifyImportRow } from "./listingImport";

describe("listing import verifier", () => {
  it("maps messy aliases and imports with optional omissions", () => { const result = verifyImportRow({ "Property Name": "Sea View Home", Area: "Beirut", "Asking Price": "$250,000", Category: "Apartment", Status: "Active" }, 1); expect(result.mapped_data.availability).toBe("available"); expect(result.mapped_data.price).toBe(250000); expect(result.row_status).toBe("optional_skipped"); });
  it("requires the four minimum field groups", () => { const result = verifyImportRow({ Notes: "nothing mapped" }, 2); expect(result.row_status).toBe("required_missing"); expect(result.messages).toHaveLength(4); });
  it("accepts price-on-request text", () => { const result = verifyImportRow({ Address: "Hamra", Price: "POA", Type: "office", Status: "available" }, 3); expect(result.mapped_data.price_status).toBe("POA"); expect(result.row_status).toBe("optional_skipped"); });
  it("flags unknown status for review", () => expect(verifyImportRow({ Title: "A", Price: 1, Type: "land", Status: "mystery" }, 4).row_status).toBe("needs_review"));
  it("marks duplicates explicitly", () => expect(markDuplicate(verifyImportRow({ Title: "A", Price: 1, Type: "land", Status: "available" }, 5)).row_status).toBe("duplicate_skipped"));
  it("reads a full listing from one pasted description cell", () => {
    const result = verifyImportRow({
      Description: `Title: Marina Heights Apartment
Location: Beirut Waterfront
Price: $250000
Type: apartment
Status: available
Bedrooms: 2
Bathrooms: 2
Size: 1400
Features: parking, balcony, sea view`
    }, 6);
    expect(result.row_status).toBe("optional_skipped");
    expect(result.mapped_data).toMatchObject({ title: "Marina Heights Apartment", location: "Beirut Waterfront", price: 250000, type: "apartment", availability: "available", bedrooms: 2, bathrooms: 2, size: 1400 });
  });
});
