import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export interface FAQ { q: string; a: string; }

export interface PostMeta {
  title: string;
  slug: string;
  description: string;
  category: string;
  readingTime: number;
  date: string;
  tags?: string[];
  faqs?: FAQ[];
}

export interface Post extends PostMeta {
  html: string;
  headings: { id: string; text: string }[];
}

function calcReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function slugify(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function processHeadings(rawHtml: string): { html: string; headings: { id: string; text: string }[] } {
  const headings: { id: string; text: string }[] = [];
  const html = rawHtml.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, "").trim();
    const id = slugify(text);
    headings.push({ id, text });
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });
  return { html, headings };
}

export function getAllPosts(): PostMeta[] {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      title:       data.title as string,
      slug:        data.slug as string,
      description: data.description as string,
      category:    data.category as string,
      readingTime: calcReadingTime(content),
      date:        (data.date as string | undefined) ?? "2026-06-21",
      tags:        (data.tags as string[] | undefined) ?? undefined,
      faqs:        (data.faqs as FAQ[] | undefined) ?? undefined,
    };
  });
}

export function getPostBySlug(slug: string): Post | null {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    if ((data.slug as string) === slug) {
      const { html, headings } = processHeadings(marked.parse(content) as string);
      return {
        title:       data.title as string,
        slug:        data.slug as string,
        description: data.description as string,
        category:    data.category as string,
        readingTime: calcReadingTime(content),
        date:        (data.date as string | undefined) ?? "2026-06-21",
        tags:        (data.tags as string[] | undefined) ?? undefined,
        faqs:        (data.faqs as FAQ[] | undefined) ?? undefined,
        html,
        headings,
      };
    }
  }
  return null;
}
