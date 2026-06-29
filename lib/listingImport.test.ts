import { describe, expect, it } from "vitest";
import { markDuplicate, verifyImportRow } from "./listingImport";

describe("listing import verifier", () => {
  it("maps messy aliases and imports with optional omissions", () => { const result = verifyImportRow({ "Property Name": "Sea View Home", Area: "Beirut", "Asking Price": "$250,000", Category: "Apartment", Status: "Active" }, 1); expect(result.mapped_data.availability).toBe("available"); expect(result.mapped_data.price).toBe(250000); expect(result.row_status).toBe("optional_skipped"); });
  it("requires true identity data when a row cannot become a listing", () => { const result = verifyImportRow({ Notes: "" }, 2); expect(result.row_status).toBe("required_missing"); expect(result.messages).toContain("Required missing: title, project, unit, or location"); });
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
  it("imports Medyar availability rows from project/unit/layout columns", () => {
    const result = verifyImportRow({ Project: "Medyar", Tower: "A", Unit: "1203", Layout: "2BR", "Selling Price": "", Area: "1280", View: "Sea", Floor: "12" }, 7, { fileName: "MEDYAR AVAILABILITY.xlsx" });
    expect(result.row_status).toBe("optional_skipped");
    expect(result.mapped_data).toMatchObject({ title: "Medyar Unit 1203", location: "Medyar", type: "apartment", availability: "available", price: null, price_status: "price_on_request", size: 1280 });
    expect(result.messages).not.toContain("Required missing: listing status");
  });
  it("imports under-construction files using filename status inference", () => {
    const result = verifyImportRow({ Building: "Medyar Hills", Reference: "B-08", "Unit Type": "Villa", Amount: 500000, Handover: "Q4 2027", "Payment Plan": "30/70" }, 8, { fileName: "Medyar Under-Construction.xlsx" });
    expect(result.row_status).toBe("optional_skipped");
    expect(result.mapped_data).toMatchObject({ title: "Medyar Hills Unit B-08", availability: "under_construction", type: "villa", price: 500000, completion_date: "Q4 2027" });
  });
});
