import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Client Cookie Policy — NexGuild",
  description: "Explains standard web browsing cookie configurations for NexGuild informational pages.",
};

export default function ClientCookiePolicyPage() {
  return (
    <div style={{ background: "#faefef", color: "#1C1917", minHeight: "100vh" }} className="py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-[#D97706] text-xs font-bold uppercase tracking-widest mb-3 italic">
          Corporate Edition • Last updated: June 2026
        </p>
        
        <h1 
          className="text-4xl sm:text-6xl font-bold text-[#1C1917] mb-8 tracking-tight"
          style={{ fontFamily: "Instrument Serif, serif", lineHeight: "1.1" }}
        >
          Client Cookie Policy
        </h1>

        <div className="space-y-8 text-sm sm:text-base text-[#44403C] leading-relaxed">
          <p className="text-stone-900 font-medium">
            This tracking notice applies strictly to visitors browsing our informational corporate interfaces and service descriptions on the NexGuild platform.
          </p>

          <div className="pt-4 border-t border-dashed border-stone-400/30">
            <h2 className="text-xl font-bold text-[#1C1917] mb-3">1. No Corporate Login or Client Session Cookies</h2>
            <p>
              Because NexGuild manages client operations manually through direct professional messaging networks (Email, WhatsApp, Telegram), <strong>this website does not deploy authentication cookies, financial dashboard logs, or active profile tracking states for clients</strong>.
            </p>
          </div>

          <div className="pt-4 border-t border-dashed border-stone-400/30">
            <h2 className="text-xl font-bold text-[#1C1917] mb-3">2. Standard Preferences</h2>
            <p>
              We only utilize basic browser local storage or configuration caches to remember language preferences or general layout rendering speeds. These do not extract personal markers or monitor your active corporate network setups.
            </p>
          </div>

          <p className="text-xs text-stone-500 pt-6 border-t border-stone-400/40">
            If you have questions about our clean web infrastructure tracking rules, feel free to drop an inquiry at{" "}
            <a href="mailto:nexguild.in@gmail.com" className="text-[#D97706] font-bold hover:underline">
              nexguild.in@gmail.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}