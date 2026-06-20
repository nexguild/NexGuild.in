"use client";

import { useEffect, useRef } from "react";

// Unit A — invoke.js container style (earn-top, blog-index-top, blog-post-top)
const UNIT_A_KEY = "376d89fc1091245970f08f96042dd6fc";
const UNIT_A_SRC = `https://pl29814985.effectivecpmnetwork.com/${UNIT_A_KEY}/invoke.js`;

// Unit B — atOptions iframe 300×250 (blog-post-end)
const UNIT_B_KEY = "679e264aa603778e87cd0b4a0cfe95e7";
const UNIT_B_SRC = `https://www.highperformanceformat.com/${UNIT_B_KEY}/invoke.js`;

// Prevent duplicate script injection for Unit A across multiple AdSlot instances
let unitALoaded = false;

interface AdSlotProps {
  placement: string;
  className?: string;
}

export function AdSlot({ placement, className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    if (placement === "blog-post-end") {
      // Unit B: inject atOptions + invoke script into the container div
      if (injected.current || !containerRef.current) return;
      injected.current = true;

      const optScript = document.createElement("script");
      optScript.type = "text/javascript";
      optScript.text = `atOptions={'key':'${UNIT_B_KEY}','format':'iframe','height':250,'width':300,'params':{}};`;

      const invScript = document.createElement("script");
      invScript.type = "text/javascript";
      invScript.src = UNIT_B_SRC;
      invScript.async = true;

      containerRef.current.appendChild(optScript);
      containerRef.current.appendChild(invScript);
    } else {
      // Unit A: inject invoke script once per page; Adsterra finds container div by ID
      if (unitALoaded) return;
      unitALoaded = true;

      const s = document.createElement("script");
      s.async = true;
      s.setAttribute("data-cfasync", "false");
      s.src = UNIT_A_SRC;
      document.head.appendChild(s);
    }
  }, [placement]);

  if (placement === "blog-post-end") {
    return (
      <div data-ad-placement={placement} className={className} style={{ display: "flex", justifyContent: "center" }}>
        <div ref={containerRef} />
      </div>
    );
  }

  return (
    <div data-ad-placement={placement} className={className}>
      <div id={`container-${UNIT_A_KEY}`} />
    </div>
  );
}
