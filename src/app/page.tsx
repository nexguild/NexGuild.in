"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Arrow icon ────────────────────────────────────────────────── */
function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [hov, setHov] = useState<"left" | "right" | null>(null);

  return (
    <div className="root">

      {/* ── Logo ───────────────────────────────────────────────── */}
      <div 
        style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          background: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(0, 0, 0, 0.07)",
          borderRadius: "999px",
          padding: "8px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Link
          href="/"
          aria-label="NexGuild — Home"
          style={{ display: "inline-flex", flexShrink: 0, textDecoration: "none" }}
        >
          <svg width={120} height={44} viewBox="0 0 180 95" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g transform="translate(90, 38)">
              <circle cx="0" cy="0" r="13" fill="none" stroke="#F59E0B" strokeWidth="1.5"/>
              <circle cx="0" cy="-5" r="5.5" fill="#F59E0B"/>
              <rect x="-5.5" y="1" width="11" height="11" rx="5.5" fill="#F59E0B"/>
              <circle cx="-22" cy="6" r="10" fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0.85"/>
              <circle cx="-22" cy="2" r="4" fill="#F59E0B" opacity="0.85"/>
              <rect x="-26" y="7" width="8" height="8" rx="4" fill="#F59E0B" opacity="0.85"/>
              <circle cx="22" cy="6" r="10" fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0.85"/>
              <circle cx="22" cy="2" r="4" fill="#F59E0B" opacity="0.85"/>
              <rect x="18" y="7" width="8" height="8" rx="4" fill="#F59E0B" opacity="0.85"/>
              <circle cx="-38" cy="14" r="7" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.5"/>
              <circle cx="-38" cy="11" r="3" fill="#F59E0B" opacity="0.5"/>
              <circle cx="38" cy="14" r="7" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.5"/>
              <circle cx="38" cy="11" r="3" fill="#F59E0B" opacity="0.5"/>
              <line x1="-10" y1="4" x2="-13" y2="5" stroke="#F59E0B" strokeWidth="1" opacity="0.4"/>
              <line x1="10" y1="4" x2="13" y2="5" stroke="#F59E0B" strokeWidth="1" opacity="0.4"/>
            </g>
            <text x="90" y="78" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="26" fill="#1C1917">
              Nex<tspan fill="#F59E0B">Guild</tspan>
            </text>
          </svg>
        </Link>
      </div>

      {/* ── Split ──────────────────────────────────────────────── */}
      <div className="split">

        {/* LEFT — Organizations (gold) */}
        <section
          className={`panel p-left${hov === "left" ? " hov" : hov === "right" ? " shrink" : ""}`}
          onMouseEnter={() => setHov("left")}
          onMouseLeave={() => setHov(null)}
        >
            <div className="aurora aurora-gold-1" />
          <div className="aurora aurora-gold-2" />

          {/* Vignette */}
          <div className="vig" />

          <div className="body">
            <span className="tag tg-gold">For Organizations</span>
            <h2 className="hl">
              Scale Your<br />
              <em className="em-gold">Data Projects.</em>
            </h2>
            <p className="sub">
              We recruit, brief, and manage a contributor team for
              audio, transcription, annotation and more — end to end.
            </p>
            <div className="acts">
              <Link href="/client"              className="btn btn-gold"><Arrow /> Explore Services</Link>
              <Link href="/client/how-it-works" className="lnk lnk-gold">How it works →</Link>
            </div>
            <p className="note">No account needed · Contact us directly</p>
          </div>
        </section>

        {/* Divider */}
        <div className="div-wrap" aria-hidden>
          <div className="div-ln" />
          <div className="div-badge">NEXGUILD ECOSYSTEM</div>
          <div className="div-ln" />
        </div>

        {/* RIGHT — Contributors (teal) */}
        <section
          className={`panel p-right${hov === "right" ? " hov" : hov === "left" ? " shrink" : ""}`}
          onMouseEnter={() => setHov("right")}
          onMouseLeave={() => setHov(null)}
        >
          <div className="aurora aurora-teal-1" />
          <div className="aurora aurora-teal-2" />

          {/* Vignette */}
          <div className="vig" />

          <div className="body">
            <span className="tag tg-teal">For Contributors</span>
            <h2 className="hl">
              Turn Free Time<br />
              <em className="em-teal">Into Real Money.</em>
            </h2>
            <p className="sub">
              Complete simple tasks from your phone — recording,
              testing, transcribing — and redeem NexCoins for gift vouchers.
            </p>
            <div className="acts">
              <Link href="/earn"         className="btn btn-teal"><Arrow /> Start Earning</Link>
              <Link href="/how-it-works" className="lnk lnk-teal">How it works →</Link>
            </div>
            <p className="note">Free to join · 100+ active contributors</p>
          </div>
        </section>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .root {
          height: 100vh; height: 100dvh;
          overflow: hidden;
          background: linear-gradient(to right, #FAF6EF 50%, #F0FAFA 50%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
          animation: fadeUpIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeUpIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ── Split ───────────────────────────────────────────── */
        .split {
          display: flex; flex-direction: row;
          height: 100%; width: 100%;
        }

        .panel {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          flex-basis: 50%; flex-shrink: 0; flex-grow: 0;
          transition: flex-basis 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background-clip: padding-box;
        }
        .panel.hov    { flex-basis: 62% !important; }
        .panel.shrink { flex-basis: 38% !important; }
        .p-left  { background: linear-gradient(135deg, #FAF6EF 0%, #FEF9F0 100%); }
        .p-right { background: linear-gradient(135deg, #F0FAFA 0%, #F5FCFC 100%); }

        /* ── Aurora blobs ────────────────────────────────────── */
        @keyframes auroraDrift {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(10%, -15%) scale(1.2); }
          100% { transform: translate(-5%, 8%) scale(0.9); }
        }

        .aurora {
          position: absolute; border-radius: 50%;
          filter: blur(100px); pointer-events: none;
          will-change: transform; z-index: 0;
        }

        .aurora-gold-1,
        .aurora-gold-2,
        .aurora-teal-1,
        .aurora-teal-2 {
          opacity: 1;
        }

        .aurora-gold-1 {
          width: min(60vw, 600px); height: min(60vw, 600px);
          background: rgba(245, 158, 11, 0.25);
          bottom: -20%; left: 5%;
          animation: auroraDrift 25s ease-in-out infinite alternate;
        }
        .aurora-gold-2 {
          width: min(50vw, 500px); height: min(50vw, 500px);
          background: rgba(245, 158, 11, 0.25);
          top: -10%; right: 5%;
          animation: auroraDrift 20s ease-in-out infinite alternate-reverse;
        }

        .aurora-teal-1 {
          width: min(60vw, 600px); height: min(60vw, 600px);
          background: rgba(20, 184, 166, 0.20);
          bottom: -20%; right: 5%;
          animation: auroraDrift 25s ease-in-out infinite alternate-reverse;
        }
        .aurora-teal-2 {
          width: min(50vw, 500px); height: min(50vw, 500px);
          background: rgba(20, 184, 166, 0.20);
          top: -8%; left: 5%;
          animation: auroraDrift 22s ease-in-out infinite alternate;
        }

        /* Brighten blobs on hover */
        .panel.hov .aurora-gold-1,
        .panel.hov .aurora-gold-2 { filter: blur(96px) brightness(1.15); }
        .panel.hov .aurora-teal-1,
        .panel.hov .aurora-teal-2 { filter: blur(96px) brightness(1.15); }

        /* ── Vignette ─────────────────────────────────────────── */
        .vig {
          position: absolute; inset: 0; z-index: 3; pointer-events: none;
          background: radial-gradient(ellipse 75% 75% at 50% 50%, transparent 45%, rgba(0,0,0,0.08) 100%);
        }

        /* ── Content ──────────────────────────────────────────── */
        .body {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: clamp(16px,4vw,60px) clamp(20px,5vw,64px);
          max-width: 440px; width: 100%;
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .panel.hov .body { transform: scale(1.025); }

        .tag {
          font-size: 11px; font-weight: 600; letter-spacing: 0.10em; text-transform: uppercase;
          padding: 6px 14px; border-radius: 9999px; margin-bottom: 22px; display: inline-block;
          font-family: 'Inter', sans-serif;
        }
        .tg-gold { color: #92400E; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); }
        .tg-teal { color: #134E4A; background: rgba(13,148,136,0.08); border: 1px solid rgba(13,148,136,0.25); }

        .hl {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(24px,3vw,46px); font-weight: 600;
          color: #1C1917;
          line-height: 1.10; letter-spacing: -0.03em; margin-bottom: 18px;
        }
        /* white-space: nowrap keeps "Into Real Money." on one line */
        .em-gold { font-style: italic; color: #92400E; white-space: nowrap; font-weight: 700; }
        .em-teal { font-style: italic; color: #115E59; white-space: nowrap; font-weight: 700; }

        .sub {
          font-size: clamp(13px,1.1vw,15px); line-height: 1.72; font-family: 'Inter', sans-serif;
          color: #44403C; max-width: 276px; margin-bottom: 30px;
        }

        /* ── Buttons ──────────────────────────────────────────── */
        .acts {
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          margin-bottom: 18px; width: 100%;
        }

        .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          width: min(230px,100%); height: 50px; border-radius: 999px;
          font-weight: 600; font-size: 15px; letter-spacing: -0.01em; text-decoration: none;
          backdrop-filter: blur(12px);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn:hover { transform: translateY(-2px); }

        .btn-gold {
          background: rgba(255, 255, 255, 0.72);
          border: 1.5px solid rgba(217, 119, 6, 0.35);
          color: #92400E;
        }
        .btn-gold:hover {
          border-color: rgba(217, 119, 6, 0.65);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
        }

        .btn-teal {
          background: rgba(255, 255, 255, 0.72);
          border: 1.5px solid rgba(13, 148, 136, 0.35);
          color: #134E4A;
        }
        .btn-teal:hover {
          border-color: rgba(13, 148, 136, 0.65);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15);
        }

        .lnk {
          font-size: 13px; font-weight: 500; text-decoration: none; font-family: 'Inter', sans-serif;
          color: #44403C;
          opacity: 0.90; transition: opacity 0.2s;
        }
        .lnk:hover { opacity: 1; }
        .lnk-gold { color: #92400E; }
        .lnk-teal { color: #134E4A; }

        .note { font-size: 11px; color: #44403C; letter-spacing: 0.02em; font-family: 'Inter', sans-serif; }

        /* ── Divider ──────────────────────────────────────────── */
        .div-wrap {
          width: 1px; flex-shrink: 0; z-index: 20;
          display: flex; flex-direction: column; align-items: center;
          background: linear-gradient(to bottom, transparent, rgba(28,25,23,0.12) 50%, transparent);
        }
        .div-ln {
          flex: 1; width: 1px;
          background: transparent;
        }
        .div-badge {
          padding: 8px 6px; writing-mode: vertical-rl;
          font-size: 9px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase;
          flex-shrink: 0; user-select: none;
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(28, 25, 23, 0.08);
          border-radius: 999px;
          color: #78716C;
          font-family: 'Inter', sans-serif;
        }
        .db-n { display: none; }
        .db-g { display: inline; }

        /* ── Mobile ───────────────────────────────────────────── */
        @media (max-width: 700px) {
          /* Root scrolls on mobile — no fixed viewport clipping */
          .root {
            display: flex; flex-direction: column;
            height: auto; min-height: 100dvh;
            overflow-x: hidden; overflow-y: auto;
            background: linear-gradient(to bottom, #FAF6EF 50%, #F0FAFA 50%);
          }

          /* Logo flows in document — no absolute overlap */
          .logo-wrap {
            position: relative; top: auto; left: auto; right: auto;
            flex-shrink: 0; padding: 16px 0 12px;
          }

          /* Split stacks naturally, not height-constrained */
          .split { display: flex; flex-direction: column; flex: none; }

          /* Each panel is fully independent — min 50vh, grows with content */
          .panel {
            flex-basis: auto !important;
            flex-shrink: 0 !important;
            flex-grow: 0 !important;
            min-height: 50vh;
            height: auto;
            overflow: hidden;
            transition: none;
          }
          .panel.hov, .panel.shrink { flex-basis: auto !important; }
          .panel.hov .body { transform: none; }

          /* Content padding — top and bottom breathing room */
          .body { padding: 32px 20px 36px; }

          /* Horizontal divider */
          .div-wrap { width: 100%; height: 1px; flex-direction: row; background: linear-gradient(to right, transparent, rgba(28,25,23,0.12) 50%, transparent); }
          .div-ln {
            flex: 1; height: 1px; width: auto;
            background: transparent;
          }
          .div-badge { writing-mode: horizontal-tb; padding: 6px 12px; font-size: 8px; }

          .hl   { font-size: clamp(20px,5vw,26px); }
          .sub  { font-size: 12px; max-width: 240px; margin-bottom: 20px; }
          .tag  { font-size: 10px; margin-bottom: 14px; }
          .btn  { height: 44px; font-size: 14px; }
          .acts { gap: 10px; margin-bottom: 12px; }
          .note { font-size: 10px; }
        }
        @media (max-width: 380px) {
          .hl  { font-size: 19px; }
          .btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}
