import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export interface PostMeta {
  title: string;
  slug: string;
  description: string;
  category: string;
  readingTime: number;
}

export interface Post extends PostMeta {
  html: string;
}

function calcReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
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
      title: data.title as string,
      slug: data.slug as string,
      description: data.description as string,
      category: data.category as string,
      readingTime: calcReadingTime(content),
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
      return {
        title: data.title as string,
        slug: data.slug as string,
        description: data.description as string,
        category: data.category as string,
        readingTime: calcReadingTime(content),
        html: marked.parse(content) as string,
      };
    }
  }
  return null;
}
