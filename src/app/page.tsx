"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { NexGuildLogo } from "@/components/ui/nexguild-logo";

/* ── Per-panel particle canvas ─────────────────────────────────── */
interface Dot { x: number; y: number; vx: number; vy: number; r: number; }

function PanelCanvas({ cr, cg, cb }: { cr: number; cg: number; cb: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let dots: Dot[] = [];

    const init = () => {
      const w = canvas.offsetWidth  || window.innerWidth / 2;
      const h = canvas.offsetHeight || window.innerHeight;
      canvas.width  = w;
      canvas.height = h;
      const n = Math.min(45, Math.floor((w * h) / 13000));
      dots = Array.from({ length: n }, () => ({
        x:  Math.random() * w,
        y:  Math.random() * h,
        vx: (Math.random() - 0.5) * 0.30,
        vy: (Math.random() - 0.5) * 0.30,
        r:  Math.random() * 1.2 + 0.5,
      }));
    };

    const frame = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const LINK = 110;

      dots.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < d.r || d.x > w - d.r) { d.vx *= -1; d.x = Math.max(d.r, Math.min(w - d.r, d.x)); }
        if (d.y < d.r || d.y > h - d.r) { d.vy *= -1; d.y = Math.max(d.r, Math.min(h - d.r, d.y)); }
      });

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dist = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
          if (dist < LINK) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${(1 - dist / LINK) * 0.22})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      dots.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.52)`;
        ctx.fill();
      });

      raf = requestAnimationFrame(frame);
    };

    init();
    frame();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, [cr, cg, cb]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: "absolute", inset: 0, zIndex: 1,
        pointerEvents: "none", width: "100%", height: "100%",
      }}
    />
  );
}

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
      <div className="logo-wrap">
        <NexGuildLogo variant="landing" theme="gold" />
      </div>

      {/* ── Split ──────────────────────────────────────────────── */}
      <div className="split">

        {/* LEFT — Organizations (gold) */}
        <section
          className={`panel p-left${hov === "left" ? " hov" : hov === "right" ? " shrink" : ""}`}
          onMouseEnter={() => setHov("left")}
          onMouseLeave={() => setHov(null)}
        >
          {/* Gold particle network — only gold dots in this panel */}
          <PanelCanvas cr={245} cg={158} cb={11} />

          {/* Aurora blobs */}
          <div className="blob bl-main" />
          <div className="blob bl-top"  />
          <div className="blob bl-edge" />

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
          <div className="div-badge">
            <span className="db-n">Nex</span><span className="db-g">Guild</span>
          </div>
          <div className="div-ln" />
        </div>

        {/* RIGHT — Contributors (teal) */}
        <section
          className={`panel p-right${hov === "right" ? " hov" : hov === "left" ? " shrink" : ""}`}
          onMouseEnter={() => setHov("right")}
          onMouseLeave={() => setHov(null)}
        >
          {/* Teal particle network — only teal dots in this panel */}
          <PanelCanvas cr={20} cg={184} cb={166} />

          {/* Aurora blobs */}
          <div className="blob br-main" />
          <div className="blob br-top"  />
          <div className="blob br-edge" />

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
              testing, transcribing — and get paid to your UPI.
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
          background: #070707;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing: antialiased;
          position: relative;
        }

        /* ── Logo ─────────────────────────────────────────────── */
        .logo-wrap {
          position: absolute; top: 0; left: 0; right: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding-top: 14px; pointer-events: auto;
        }
        .logo-wrap a { opacity: 0.90; transition: opacity 0.2s; }
        .logo-wrap a:hover { opacity: 1; }

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
        }
        .panel.hov    { flex-basis: 62% !important; }
        .panel.shrink { flex-basis: 38% !important; }
        .p-left  { background: #090909; }
        .p-right { background: #05101E; }

        /* ── Aurora blobs ────────────────────────────────────── */
        @keyframes drift {
          0%,100% { transform: translate(0,0)    scale(1); }
          33%      { transform: translate(-4%,3%) scale(1.08); }
          66%      { transform: translate(4%,-3%) scale(0.94); }
        }
        @keyframes drift2 {
          0%,100% { transform: translate(0,0)    scale(1); }
          40%      { transform: translate(5%,-4%) scale(1.12); }
          75%      { transform: translate(-5%,4%) scale(0.92); }
        }

        .blob {
          position: absolute; border-radius: 50%;
          filter: blur(68px); pointer-events: none;
          will-change: transform; z-index: 2;
        }

        /* Left blobs — gold */
        .bl-main {
          width: min(55%,400px); height: min(55%,400px);
          background: radial-gradient(circle, rgba(245,158,11,0.20) 0%, rgba(245,158,11,0.05) 70%, transparent 100%);
          bottom: -12%; left: 50%; transform: translateX(-50%);
          animation: drift 8s ease-in-out infinite;
        }
        .bl-top {
          width: min(25%,200px); height: min(25%,200px);
          background: radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%);
          top: 10%; right: 10%;
          animation: drift2 11s ease-in-out infinite; animation-delay: -3s;
        }
        .bl-edge {
          width: min(20%,150px); height: min(20%,150px);
          background: radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 70%);
          top: 42%; left: 4%;
          animation: drift 13s ease-in-out infinite; animation-delay: -6s;
        }

        /* Right blobs — teal */
        .br-main {
          width: min(55%,400px); height: min(55%,400px);
          background: radial-gradient(circle, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0.05) 70%, transparent 100%);
          bottom: -12%; left: 50%; transform: translateX(-50%);
          animation: drift 9s ease-in-out infinite; animation-delay: -2s;
        }
        .br-top {
          width: min(25%,200px); height: min(25%,200px);
          background: radial-gradient(circle, rgba(94,234,212,0.13) 0%, transparent 70%);
          top: 10%; left: 10%;
          animation: drift2 12s ease-in-out infinite; animation-delay: -5s;
        }
        .br-edge {
          width: min(20%,150px); height: min(20%,150px);
          background: radial-gradient(circle, rgba(20,184,166,0.09) 0%, transparent 70%);
          top: 42%; right: 4%;
          animation: drift 14s ease-in-out infinite; animation-delay: -8s;
        }

        /* Brighten blobs on hover */
        .panel.hov .bl-main,
        .panel.hov .bl-top  { filter: blur(60px) brightness(1.4); }
        .panel.hov .br-main,
        .panel.hov .br-top  { filter: blur(60px) brightness(1.4); }

        /* ── Vignette ─────────────────────────────────────────── */
        .vig {
          position: absolute; inset: 0; z-index: 3; pointer-events: none;
          background: radial-gradient(ellipse 75% 75% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%);
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
          font-size: 11px; font-weight: 700; letter-spacing: 0.10em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 9999px; margin-bottom: 22px; display: inline-block;
        }
        .tg-gold { color: #F59E0B; background: rgba(245,158,11,0.09); border: 1px solid rgba(245,158,11,0.20); }
        .tg-teal { color: #14b8a6; background: rgba(20,184,166,0.09); border: 1px solid rgba(20,184,166,0.20); }

        .hl {
          font-size: clamp(26px,3.4vw,50px); font-weight: 800; color: #fff;
          line-height: 1.10; letter-spacing: -0.03em; margin-bottom: 18px;
        }
        .em-gold { font-style: normal; color: #F59E0B; }
        .em-teal { font-style: normal; color: #14b8a6; }

        .sub {
          font-size: clamp(13px,1.1vw,15px); line-height: 1.72;
          color: rgba(255,255,255,0.42); max-width: 276px; margin-bottom: 30px;
        }

        /* ── Buttons ──────────────────────────────────────────── */
        .acts {
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          margin-bottom: 18px; width: 100%;
        }

        .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          width: min(230px,100%); height: 50px; border-radius: 14px;
          font-weight: 700; font-size: 15px; letter-spacing: -0.01em; text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }
        .btn:hover { transform: translateY(-2px); }

        .btn-gold {
          background: linear-gradient(135deg,#F59E0B,#D97706);
          color: #0c0800;
          box-shadow: 0 4px 22px rgba(245,158,11,0.32), inset 0 1px 0 rgba(255,255,255,0.18);
        }
        .btn-gold:hover { box-shadow: 0 8px 36px rgba(245,158,11,0.52), inset 0 1px 0 rgba(255,255,255,0.18); }

        .btn-teal {
          background: linear-gradient(135deg,#14b8a6,#0d9488);
          color: #021510;
          box-shadow: 0 4px 22px rgba(20,184,166,0.28), inset 0 1px 0 rgba(255,255,255,0.18);
        }
        .btn-teal:hover { box-shadow: 0 8px 36px rgba(20,184,166,0.48), inset 0 1px 0 rgba(255,255,255,0.18); }

        .lnk {
          font-size: 13px; font-weight: 500; text-decoration: none;
          opacity: 0.38; transition: opacity 0.2s;
        }
        .lnk:hover { opacity: 0.80; }
        .lnk-gold { color: #F59E0B; }
        .lnk-teal { color: #14b8a6; }

        .note { font-size: 11px; color: rgba(255,255,255,0.18); letter-spacing: 0.02em; }

        /* ── Divider ──────────────────────────────────────────── */
        .div-wrap {
          width: 1px; flex-shrink: 0; z-index: 20;
          display: flex; flex-direction: column; align-items: center;
        }
        .div-ln {
          flex: 1; width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 50%, transparent);
        }
        .div-badge {
          padding: 10px 4px; writing-mode: vertical-rl;
          font-size: 9px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
          flex-shrink: 0; user-select: none;
        }
        .db-n { color: rgba(255,255,255,0.22); }
        .db-g { color: rgba(245,158,11,0.32); }

        /* ── Mobile ───────────────────────────────────────────── */
        @media (max-width: 700px) {
          .split { flex-direction: column; }
          .panel { flex-basis: 50% !important; transition: none; }
          .panel.hov, .panel.shrink { flex-basis: 50% !important; }
          .panel.hov .body { transform: none; }

          .div-wrap { width: 100%; height: 1px; flex-direction: row; }
          .div-ln {
            flex: 1; height: 1px; width: auto;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.08) 50%, transparent);
          }
          .div-badge { writing-mode: horizontal-tb; padding: 4px 12px; font-size: 8px; }

          .hl   { font-size: clamp(20px,5vw,26px); }
          .sub  { font-size: 12px; max-width: 240px; margin-bottom: 20px; }
          .tag  { font-size: 10px; margin-bottom: 14px; }
          .btn  { height: 44px; font-size: 14px; }
          .body { padding: 14px 18px; }
          .acts { gap: 10px; margin-bottom: 12px; }
          .note { font-size: 10px; }
          .logo-wrap { padding-top: 8px; }
          canvas { display: none; }
        }
        @media (max-width: 380px) {
          .hl  { font-size: 19px; }
          .btn { width: 100%; }
        }
      `}</style>
    </div>
  );
}
