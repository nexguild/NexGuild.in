import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Privacy Policy — NexGuild",
  description: "NexGuild is committed to protecting your personal information and being transparent about what we collect and how we use it.",
};

export default function PrivacyPage() {
  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }} className="py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-[#0D9488] text-xs font-bold uppercase tracking-widest mb-3 italic">
          Last updated: June 2025
        </p>
        
        <h1 
          className="text-4xl sm:text-6xl font-black text-[#0F3D36] mb-8 tracking-tight"
          style={{ fontFamily: "'Instrument Serif', serif", lineHeight: "1.1" }}
        >
          Privacy Policy
        </h1>

        <div className="space-y-8 text-sm sm:text-base text-stone-600 leading-relaxed">
          <p className="text-stone-700 font-medium">
            At NexGuild, we value the trust you place in us when sharing your personal information. This Privacy Policy outlines our strict frameworks regarding the collection, processing, usage, and protection of data provided by contributors using our Platform.
          </p>

          {/* Section 1 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              1. Information We Collect and Categorize
            </h2>
            <p className="mb-3">
              To provide a functional crowdsourcing environment, we collect the following categories of information when you interact with the Platform:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li><strong>Account Credentials:</strong> Full name, verified email address, geographical country, and account login configurations (safeguarded via secure database architecture).</li>
              <li><strong>Profile Metadata:</strong> Demographics, spoken languages, core digital skills, and device technical specifications (mobile/desktop system properties) to optimize task assignment.</li>
              <li><strong>Submission Content:</strong> The direct operational data you upload during tasks, including audio voice files, transcribed text strings, surveys, image sets, or interface testing logs.</li>
              <li><strong>Technical Logs:</strong> Internet Protocol (IP) addresses, device hardware signatures, browser cookies, and session activity tracking to shield the infrastructure against malicious multi-accounting.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              2. How We Process and Share Collected Information
            </h2>
            <p className="mb-3">
              Your profile metrics and metadata are explicitly utilized to monitor system stability, verify submission accuracy, audit voucher transactions, and block automated bots.
            </p>
            <p className="mb-3">
              <strong>Third-Party Vendor Processing:</strong> NexGuild partner companies and research institutions receive the anonymous technical datasets and task submissions (such as voice logs or text labels) to build machine learning systems and language models. This submission data is stripped of your personal email or real name before sharing to preserve contributor anonymity.
            </p>
            <p>
              <strong>No Data Selling:</strong> We do not sell, trade, or rent your personal account identifiers (like your email address or account password) to generic advertising brokers or third-party marketing companies.
            </p>
          </div>

          {/* Section 3 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              3. Data Encryption, Security, and Storage
            </h2>
            <p className="mb-3">
              We employ enterprise-grade security protocols to protect your personal account profile. All credentials and transaction paths are stored using robust database encryption through our infrastructure provider (Supabase Auth and PostgreSQL layers). This guards against data breaches, unauthorized modifications, or leakage.
            </p>
            <p>
              However, please note that no method of transmission over the internet or electronic storage solution is 100% secure. While we execute optimal standard practices to shield your account, we cannot guarantee absolute absolute security against targeted cyber-attacks.
            </p>
          </div>

          {/* Section 4 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              4. Data Retention and Deletion Rights
            </h2>
            <p className="mb-3">
              We retain your core account metrics for as long as your registered profile stays active on our grid. This enables us to maintain historical audit rails for completed rewards and compliance verifications.
            </p>
            <p>
              If you wish to terminate your profile and permanently delete your operational personal records, you have the right to request a complete account wipe by reaching out to our support channel. Upon verification, your profile markers will be permanently expunged from active nodes within 30 days, except where retention is legally required.
            </p>
          </div>

          {/* Section 5 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              5. Children&apos;s Privacy Framework
            </h2>
            <p>
              NexGuild strictly restricts platform accessibility to individuals who are at least 18 years of age. We do not knowingly monitor, gather, or invite data pools from children under the age of 18. If we detect that a minor has bypassed verification and generated a profile, we will instantly delete the records and ban the node.
            </p>
          </div>

          {/* Footer note */}
          <p className="text-xs text-stone-500 pt-6 border-t border-stone-300/60">
            For specific inquiries or privacy complaints regarding your data management, please write to our compliance officer at{" "}
            <a href="mailto:nexguild.in@gmail.com" className="text-[#0D9488] font-bold hover:underline">
              nexguild.in@gmail.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}