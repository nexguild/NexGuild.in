import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Client Privacy Policy — NexGuild",
  description: "Details personal and corporate communication data security protocols for enterprise clients.",
};

export default function ClientPrivacyPage() {
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
          Client Privacy Policy
        </h1>

        <div className="space-y-8 text-sm sm:text-base text-[#44403C] leading-relaxed">
          <p className="text-stone-900 font-medium">
            NexGuild enforces corporate confidentiality standards regarding all proprietary sample assets, company blueprints, tax details, and communication strings shared with our operations team.
          </p>

          <div className="pt-4 border-t border-dashed border-stone-400/30">
            <h2 className="text-xl font-bold text-[#1C1917] mb-3">1. Information Shared Via Off-Platform Channels</h2>
            <p className="mb-3">
              Since NexGuild utilizes direct B2B channels for client onboarding, we protect and log all business data received through:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Corporate Emails:</strong> Official communications, milestone updates, agreements, and corporate tax/GST certificates.</li>
              <li><strong>Secure Messengers (WhatsApp / Telegram):</strong> Operational feedback, dynamic sprint changes, and asset verification logs.</li>
              <li><strong>Source Datasets:</strong> Any seed text strings, dictionary arrays, or raw samples shared to build the validation tasks.</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-dashed border-stone-400/30">
            <h2 className="text-xl font-bold text-[#1C1917] mb-3">2. Confidentiality Rules During Crowdsourcing</h2>
            <p>
              We guarantee that your identity, primary company strategies, and overall dataset blueprint will not be exposed to the public. Our contributor network only receives individual, anonymized micro-slices of tasks to parse or annotate, ensuring no external entity can copy your compiled end-product.
            </p>
          </div>

          <p className="text-xs text-stone-500 pt-6 border-t border-stone-400/40">
            For data protection inquiries or to request immediate deletion of your shared communication archives from our local records, contact us at{" "}
            <a href="mailto:admin@nexguild.in" className="text-[#D97706] font-bold hover:underline">
              admin@nexguild.in
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}