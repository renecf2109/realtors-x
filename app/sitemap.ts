import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://realtors-x.vercel.app";
  return ["", "/chat", "/listings", "/projects", "/investments", "/login", "/signup"].map(path => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" ? "weekly" as const : "daily" as const, priority: path === "" ? 1 : .8 }));
}
