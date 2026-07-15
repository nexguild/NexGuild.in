"use client";

import { useEffect, useRef } from "react";

const ENABLE_MONETAG_ADS = true;
const ACTIVE_PLACEMENTS = [
  "blog-post-top",    // individual blog articles
  "blog-index-top",   // /earn/blog listing
  "earn-top",         // /earn main page
  "faq-top",          // /earn/faq
  "how-it-works-top", // /earn/how-it-works
  "jobs-top",         // /earn/jobs
];

// Monetag Vignette — zone 11179049 via n6wxm.com/vignette.min.js
// Was active on earn-top only. Blog slots (blog-index-top, blog-post-top,
// blog-post-end) were never live — they remain placeholder until ads resume.
const MONETAG_ZONE = "11179049";
const MONETAG_SRC = "https://n6wxm.com/vignette.min.js";

interface AdSlotProps {
  placement: string;
  className?: string;
}

export function AdSlot({ placement }: AdSlotProps) {
  const injected = useRef(false);

  useEffect(() => {
    if (!ENABLE_MONETAG_ADS) return;
    if (!ACTIVE_PLACEMENTS.includes(placement)) return;
    if (injected.current) return;
    injected.current = true;

    const s = document.createElement("script");
    (document.body || document.documentElement).appendChild(s);
    s.dataset.zone = MONETAG_ZONE;
    s.src = MONETAG_SRC;
  }, [placement]);

  return null;
}
