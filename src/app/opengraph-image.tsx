import { ImageResponse } from "next/og";

export const alt = "NexGuild — Digital Workforce Community";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f2027 0%, #0d3b31 50%, #02b491 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(2,180,145,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "#02b491",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            boxShadow: "0 0 40px rgba(2,180,145,0.4)",
          }}
        >
          <span style={{ fontSize: 42, color: "#fff", fontWeight: 900 }}>N</span>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-2px",
            marginBottom: 16,
          }}
        >
          NexGuild
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.75)",
            fontWeight: 400,
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Earn by Contributing. Grow by Participating.
        </div>

        {/* Pill tags */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 36,
          }}
        >
          {["Micro-Tasks", "Surveys", "Data Annotation", "Offerwalls"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                background: "rgba(2,180,145,0.15)",
                border: "1px solid rgba(2,180,145,0.4)",
                color: "#02b491",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 48,
            fontSize: 18,
            color: "rgba(255,255,255,0.4)",
            fontWeight: 500,
          }}
        >
          nexguild.in
        </div>
      </div>
    ),
    { ...size },
  );
}
