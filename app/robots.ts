import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/start",
          "/privacidade",
        ],
        disallow: [
          "/admin/",
          "/gestao/",
          "/api/admin/",
        ],
      },
    ],
    sitemap: "https://www.rrv.digital/sitemap.xml",
  };
}
