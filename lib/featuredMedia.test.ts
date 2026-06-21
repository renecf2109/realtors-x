import { describe, expect, it } from "vitest";
import { activeFeaturedMedia, featuredMediaVisibility, isFeaturedMediaActive, validateFeaturedMedia } from "./featuredMedia";
import type { FeaturedMedia, FeaturedMediaInput } from "./types";

const input: FeaturedMediaInput = { title: "Waterfront", description: "", media_type: "image", media_url: "https://example.com/image.jpg", thumbnail_url: null, placement: "homepage_strip", link_url: "/projects/waterfront", sort_order: 1, is_active: true, starts_at: null, ends_at: null };
const item: FeaturedMedia = { ...input, id: "1", created_by: "user", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" };

describe("featured media validation", () => {
  it("accepts HTTPS media and internal links", () => expect(validateFeaturedMedia(input)).toBeNull());
  it("rejects unsafe media URLs", () => expect(validateFeaturedMedia({ ...input, media_url: "javascript:alert(1)" })).toContain("HTTPS"));
  it("rejects protocol-relative destination URLs", () => expect(validateFeaturedMedia({ ...input, link_url: "//example.com" })).toContain("Link URL"));
  it("rejects an end time before the start time", () => expect(validateFeaturedMedia({ ...input, starts_at: "2026-06-02T00:00:00Z", ends_at: "2026-06-01T00:00:00Z" })).toContain("after"));
  it("rejects unsupported media types and placements", () => {
    expect(validateFeaturedMedia({ ...input, media_type: "audio" } as unknown as FeaturedMediaInput)).toContain("image or video");
    expect(validateFeaturedMedia({ ...input, placement: "unknown" } as unknown as FeaturedMediaInput)).toContain("placement");
  });
});

describe("featured media visibility", () => {
  const now = new Date("2026-06-01T12:00:00Z");
  it("hides inactive and scheduled media", () => {
    expect(isFeaturedMediaActive({ ...item, is_active: false }, now)).toBe(false);
    expect(isFeaturedMediaActive({ ...item, starts_at: "2026-06-02T00:00:00Z" }, now)).toBe(false);
    expect(isFeaturedMediaActive({ ...item, ends_at: "2026-06-01T00:00:00Z" }, now)).toBe(false);
  });
  it("sorts active items", () => expect(activeFeaturedMedia([{ ...item, id: "2", sort_order: 2 }, item], now).map(value => value.id)).toEqual(["1", "2"]));
  it("describes live, inactive, scheduled, and expired visibility", () => {
    expect(featuredMediaVisibility(item, now)).toBe("live");
    expect(featuredMediaVisibility({ ...item, is_active: false }, now)).toBe("inactive");
    expect(featuredMediaVisibility({ ...item, starts_at: "2026-06-02T00:00:00Z" }, now)).toBe("scheduled");
    expect(featuredMediaVisibility({ ...item, ends_at: "2026-06-01T00:00:00Z" }, now)).toBe("expired");
  });
});
