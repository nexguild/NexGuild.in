"use client";

import { useEffect, useRef } from "react";

// Monetag Vignette — active on earn-top only (content quality test, 2026-06-21)
// Zone 11179049 via n6wxm.com/vignette.min.js
// Other slots (blog-index-top, blog-post-top, blog-post-end) remain placeholder
// until earn-page quality check passes.
const MONETAG_ZONE = "11179049";
const MONETAG_SRC = "https://n6wxm.com/vignette.min.js";

interface AdSlotProps {
  placement: string;
  className?: string;
}

export function AdSlot({ placement }: AdSlotProps) {
  const injected = useRef(false);

  useEffect(() => {
    if (placement !== "earn-top") return;
    if (injected.current) return;
    injected.current = true;

    // Replicates Monetag's own embed:
    // (function(s){s.dataset.zone=...,s.src=...})(body.appendChild(createElement('script')))
    const s = document.createElement("script");
    (document.body || document.documentElement).appendChild(s);
    s.dataset.zone = MONETAG_ZONE;
    s.src = MONETAG_SRC;
  }, [placement]);

  return null;
}
