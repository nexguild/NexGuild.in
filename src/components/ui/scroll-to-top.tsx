"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  const isTeal =
    pathname.startsWith("/earn") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/opportunities") ||
    pathname === "/how-it-works" ||
    pathname === "/faq";

  const color = isTeal ? "#14b8a6" : "#F59E0B";

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: color,
        color: "#fff",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.9)",
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      <ArrowUp style={{ width: "18px", height: "18px" }} />
    </button>
  );
}
