import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    "https://www.rrv.digital";

  return [
    {
      url: `${base}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/start`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/privacidade`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
