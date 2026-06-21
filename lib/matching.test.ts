import { describe, expect, it } from "vitest";
import { filterProperties, parseSearch } from "./matching";
import type { Property } from "./types";

const base: Property = {
  id: "1", agent_id: "agent", title: "Sea View Apartment", price: 450000, price_status: null,
  location: "Medyar", bedrooms: 3, bathrooms: 2, size: 1800, type: "apartment",
  description: "Open sea view home", features: ["sea view", "parking"], images: [],
  project_name: null, investment_opportunity: false, expected_roi: null, completion_date: null,
  developer_name: "Private Developer", show_developer_to_public: false,
  availability: "available", created_at: "2026-01-01"
};

describe("agent inventory search", () => {
  it("combines area, types, feature, price, size, and status", () => {
    const intent = parseSearch("available sea view apartments or villas in Medyar under $500k above 1500 sq ft");
    expect(intent).toMatchObject({ maxPrice: 500000, minSize: 1500, location: "medyar", statuses: ["available"] });
    expect(intent.types).toEqual(["apartment", "villa"]);
    expect(intent.features).toContain("sea view");
    const results = filterProperties([base, { ...base, id: "2", location: "Hamra" }, { ...base, id: "3", price: 600000 }], intent);
    expect(results.map(item => item.id)).toEqual(["1"]);
  });

  it("filters by minimum price and bedrooms", () => {
    const intent = parseSearch("3 bedroom properties over $300k");
    expect(filterProperties([base, { ...base, id: "2", bedrooms: 2 }, { ...base, id: "3", price: 250000 }], intent).map(item => item.id)).toEqual(["1"]);
  });
});
