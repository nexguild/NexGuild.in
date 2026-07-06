import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

const BASE = "https://www.nexguild.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                lastModified: new Date("2026-06-21"), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/earn`,            lastModified: new Date("2026-06-21"), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/opportunities`,   lastModified: new Date("2026-06-21"), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/how-it-works`,    lastModified: new Date("2026-06-21"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`,            lastModified: new Date("2026-07-06"), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/client`,          lastModified: new Date("2026-06-21"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/services`,        lastModified: new Date("2026-06-21"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/for-organizations`, lastModified: new Date("2026-06-21"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`,         lastModified: new Date("2026-06-21"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/faq`,             lastModified: new Date("2026-06-21"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`,         lastModified: new Date("2026-06-21"), changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE}/terms`,           lastModified: new Date("2026-06-21"), changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE}/cookies`,         lastModified: new Date("2026-06-21"), changeFrequency: "yearly",  priority: 0.3 },
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