import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

const BASE = "https://www.nexguild.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date("2026-07-14");

  const staticPages: MetadataRoute.Sitemap = [
    // Core contributor pages
    { url: `${BASE}/`,                    lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/earn`,                lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/opportunities`,       lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/jobs`,                lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/how-it-works`,        lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`,                lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/faq`,                 lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/earn/about`,          lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/earn/contact`,        lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/earn/privacy`,        lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/earn/terms`,          lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/earn/cookies`,        lastModified: now, changeFrequency: "yearly",  priority: 0.3 },

    // Organisation / client pages
    { url: `${BASE}/client`,             lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/client/how-it-works`,lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/services`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/for-organizations`,  lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/about`,              lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`,            lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/client/terms`,       lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/client/privacy`,     lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/client/cookie-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Blog posts — auto-discovered from src/content/blog/*.md
  const posts = getAllPosts();
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url:             `${BASE}/blog/${post.slug}`,
    lastModified:    new Date(post.date),
    changeFrequency: "monthly" as const,
    priority:        0.7,
  }));

  return [...staticPages, ...blogPages];
}
