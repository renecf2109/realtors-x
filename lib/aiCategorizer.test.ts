import { describe, expect, it } from "vitest";
import { categorizeRequest } from "./aiCategorizer";

describe("AI workbench rule categorizer", () => {
  it("recognizes bulk imports", () => expect(categorizeRequest("Upload this messy Excel with 200 listings").category).toBe("bulk_listing_import"));
  it("recognizes property searches", () => expect(categorizeRequest("I need a sea view apartment in Beirut under 500k").category).toBe("property_search_lead"));
  it("recognizes showing requests", () => expect(categorizeRequest("Book a viewing for this villa").category).toBe("showing_request"));
  it("asks follow-up for unknown text", () => expect(categorizeRequest("hello there").requires_followup).toBe(true));
});
