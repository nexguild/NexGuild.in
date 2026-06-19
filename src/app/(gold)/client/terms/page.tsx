import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Client Terms of Service — NexGuild",
  description: "These Client Terms govern business relations and data collection campaigns managed manually via NexGuild channels.",
};

export default function ClientTermsPage() {
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
          Client Terms of Service
        </h1>

        <div className="space-y-8 text-sm sm:text-base text-[#44403C] leading-relaxed">
          <p className="text-stone-900 font-medium">
            Welcome to NexGuild. These Client Terms of Service constitute a binding contract governing how businesses, researchers, and organizations (&quot;Client&quot;, &quot;You&quot;) initiate data crowdsourcing, audio logging, or AI annotation campaigns through our manual setup desks.
          </p>

          <div className="pt-4 border-t border-dashed border-stone-400/30">
            <h2 className="text-xl font-bold text-[#1C1917] mb-3">1. Campaign Onboarding and Manual Setup</h2>
            <p className="mb-3">
              NexGuild does not operate a self-service client dashboard at this stage. To launch a crowdsourcing campaign, data collection pipeline, or transcription project, Clients must contact our official management desk via <strong>Email, WhatsApp, or Telegram</strong>.
            </p>
            <p>
              You are required to share precise project blueprints, audio benchmarks, or labeling criteria directly with our team. Once reviewed, our operations desk will manually configure and queue the tasks onto our live contributor grid.
            </p>
          </div>

          <div className="pt-4 border-t border-dashed border-stone-400/30">
            <h2 className="text-xl font-bold text-[#1C1917] mb-3">2. Invoicing, Payments, and Escrow</h2>
            <p className="mb-3">
              <strong>Custom Quotations:</strong> Upon reviewing your custom requirements, we will send an official commercial quote and milestone roadmap via email.
            </p>
            <p>
              <strong>Milestone Clearance:</strong> Deployed campaigns require an upfront deposit or statement of work execution balance cleared via direct bank transfer or verified corporate payment links. Because funds are actively calculated and converted into voucher points for physical contributors upon successful submissions, completed task milestones are non-refundable.
            </p>
          </div>

          <div className="pt-4 border-t border-dashed border-stone-400/30">
            <h2 className="text-xl font-bold text-[#1C1917] mb-3">3. Final Delivery and Intellectual Property</h2>
            <p>
              Once our contributor network completes the requested data batches, our internal QA team will run quality checks and manually deliver the clean finalized dataset to you via secure storage drives (e.g., Google Drive, AWS S3 buckets). Complete ownership and commercial intellectual properties of the custom datasets transition to the Client instantly upon the full clearance of the final invoice.
            </p>
          </div>

          <p className="text-xs text-stone-500 pt-6 border-t border-stone-400/40">
            To launch a custom campaign or discuss dataset requirements, contact our management desk directly at{" "}
            <a href="mailto:nexguild.in@gmail.com" className="text-[#D97706] font-bold hover:underline">
              nexguild.in@gmail.com
            </a> or via our official Telegram/WhatsApp business handles.
          </p>
        </div>
      </div>
    </div>
  );
}