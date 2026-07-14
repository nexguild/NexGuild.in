"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  target: number | null;
  display?: string;
  suffix?: string;
  label: string;
}

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref     = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const steps = 50;
      const inc   = target / steps;
      let cur     = 0;
      const timer = setInterval(() => {
        cur += inc;
        if (cur >= target) { setVal(target); clearInterval(timer); }
        else setVal(Math.floor(cur));
      }, 1200 / steps);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

export function AnimatedStatsBand({
  stats,
  accentColor,
  labelColor,
}: {
  stats: Stat[];
  accentColor: string;
  labelColor: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16 text-center">
      {stats.map((s) => (
        <div key={s.label}>
          <div
            className="text-3xl sm:text-4xl font-black"
            style={{ color: accentColor, fontFamily: "Instrument Serif, serif" }}
          >
            {s.target !== null && s.target !== undefined ? (
              <Counter target={s.target} suffix={s.suffix ?? ""} />
            ) : (
              s.display
            )}
          </div>
          <div
            className="text-[10px] font-bold uppercase tracking-widest mt-1.5"
            style={{ color: labelColor }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
