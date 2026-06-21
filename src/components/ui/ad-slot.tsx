"use client";

import { useEffect, useRef } from "react";

// PAUSED — re-enable once offerwalls are active + site is indexed by Google (2026-06-21)
// Flip ENABLE_MONETAG_ADS to true to restore the Vignette on earn-top.
const ENABLE_MONETAG_ADS = false;

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
    if (placement !== "earn-top") return;
    if (injected.current) return;
    injected.current = true;

    const s = document.createElement("script");
    (document.body || document.documentElement).appendChild(s);
    s.dataset.zone = MONETAG_ZONE;
    s.src = MONETAG_SRC;
  }, [placement]);

  return null;
}
