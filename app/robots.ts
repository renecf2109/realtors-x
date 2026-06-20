import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/listings", "/agent-search", "/api/"] }, sitemap: "https://realtors-x.vercel.app/sitemap.xml" };
}
