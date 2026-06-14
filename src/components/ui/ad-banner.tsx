"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  atKey: string;
  width: number;
  height: number;
  className?: string;
}

export function AdBanner({ atKey, width, height, className }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current || !containerRef.current) return;
    injected.current = true;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.setAttribute("data-cfasync", "false");
    script.src = `//pl${atKey}.profitablecpmrate.com/${atKey}/invoke.js`;
    script.async = true;

    const atOptions = document.createElement("script");
    atOptions.type = "text/javascript";
    atOptions.text = `
      atOptions = {
        'key': '${atKey}',
        'format': 'iframe',
        'height': ${height},
        'width': ${width},
        'params': {}
      };
    `;

    containerRef.current.appendChild(atOptions);
    containerRef.current.appendChild(script);
  }, [atKey, width, height]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height, overflow: "hidden" }}
    />
  );
}

/* Social bar — injected once per page load */
export function AdSocialBar({ atKey }: { atKey: string }) {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current) return;
    injected.current = true;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.setAttribute("data-cfasync", "false");
    script.src = `//pl${atKey}.profitablecpmrate.com/${atKey}/invoke.js`;
    script.async = true;
    document.body.appendChild(script);
  }, [atKey]);

  return null;
}
