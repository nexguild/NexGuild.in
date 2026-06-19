import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Terms of Service — NexGuild",
  description: "These Terms of Service govern your use of NexGuild. By creating an account, you agree to these terms.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>

        <div className="space-y-8 text-sm sm:text-base text-stone-600 leading-relaxed">
          <p className="text-stone-700 font-medium">
            Welcome to NexGuild (the &quot;Platform&quot;). These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Contributor&quot;, &quot;User&quot;, or &quot;You&quot;) and NexGuild. By creating an account, accessing, or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms.
          </p>

          {/* Section 1 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              1. Independent Contractor Relationship
            </h2>
            <p className="mb-3">
              By participating as a contributor on NexGuild, you expressly acknowledge and agree that your relationship with NexGuild is that of an <strong>Independent Contractor</strong>. Nothing contained in these Terms shall be construed as creating a partnership, joint venture, agency, or employer-employee relationship between you and NexGuild.
            </p>
            <p>
              You are solely responsible for providing your own equipment, internet connection, and workspace. As an independent contractor, you are strictly responsible for reporting and paying all applicable local, state, national, or international taxes (including income tax, GST, or TDS where applicable) on any earnings or rewards received through the Platform. NexGuild will not withhold taxes or provide employee benefits of any kind.
            </p>
          </div>

          {/* Section 2 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              2. Account Eligibility, Security, and Fraud Prevention
            </h2>
            <p className="mb-3">
              To be eligible to create an account and use the Platform, you must be at least 18 years of age or the legal age of majority in your jurisdiction. By registering, you warrant that all information provided during registration is accurate, complete, and truthful.
            </p>
            <p className="mb-3">
              <strong>Strict Single-Account Policy:</strong> Each individual is permitted to create and operate exactly <em>one (1) account</em>. The creation of multiple accounts by a single user, whether using fake names, different emails, or disposable credentials, is strictly prohibited.
            </p>
            <p>
              <strong>Anti-Fraud Controls:</strong> NexGuild utilizes automated and manual systems to detect fraudulent behavior. The use of Virtual Private Networks (VPNs), proxies, automated scripts, bots, emulators, or any third-party software intended to manipulate your geographical location or spoof task completions is a direct violation of these Terms. Engaging in such activities will result in immediate, permanent suspension of your account and the forfeiture of all balances.
            </p>
          </div>

          {/* Section 3 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              3. Task Submissions, Quality Review, and Intellectual Property
            </h2>
            <p className="mb-3">
              The Platform provides access to various micro-tasks, including but not limited to audio recordings, transcriptions, data annotations, and surveys. You agree to perform all tasks in strict accordance with the specific guidelines provided for each task.
            </p>
            <p className="mb-3">
              <strong>Quality Review Queue:</strong> All submitted work enters a quality control check. NexGuild and its partner organizations reserve the absolute right to reject any submission that fails to meet quality benchmarks (e.g., unclear audio, inaccurate labeling, incomplete responses, or rushed answers). NexCoins will only be credited for successfully approved submissions. Rejection feedback is final.
            </p>
            <p>
              <strong>Intellectual Property Transfer:</strong> By submitting any content, data, voice recordings, or text through the Platform, you hereby grant NexGuild and its partner organizations an irrevocable, perpetual, worldwide, royalty-free, transferable license to use, modify, distribute, and analyze such data for machine learning training, AI development, and commercial research purposes. You waive all moral rights to the submitted data.
            </p>
          </div>

          {/* Section 4 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              4. NexCoins Economy and Voucher Redemptions
            </h2>
            <p className="mb-3">
              NexCoins are proprietary virtual reward points used exclusively within the NexGuild ecosystem. You explicitly acknowledge that NexCoins <strong>do not constitute real currency, digital assets, or legal tender</strong>, and they carry no intrinsic cash value outside the Platform. NexCoins cannot be transferred between users or sold.
            </p>
            <p>
              NexCoins may only be redeemed for gift vouchers (such as Amazon, Flipkart, Paytm, or PhonePe) available in the official Store dashboard, subject to availability. Voucher delivery is typically processed within 48 to 72 business hours after redemption approval. NexGuild reserves the right to audit accounts prior to distributing rewards and may cancel redemptions if suspicious activity is found.
            </p>
          </div>

          {/* Section 5 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              5. Account Termination and Limitation of Liability
            </h2>
            <p className="mb-3">
              NexGuild reserves the right, in its sole discretion, to suspend, restrict, or permanently terminate your account at any time, with or without prior notice, for conduct that violates these Terms or is harmful to the Platform&apos;s ecosystem. Banned users lose all claims to pending or accumulated NexCoins.
            </p>
            <p>
              The Platform is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis. NexGuild makes no warranties, express or implied, regarding task availability, continuous uptime, or specific earning thresholds. To the maximum extent permitted by law, NexGuild shall not be liable for any indirect, incidental, or consequential damages resulting from your use or inability to use the Platform.
            </p>
          </div>

          {/* Footer note */}
          <p className="text-xs text-stone-500 pt-6 border-t border-stone-300/60">
            For formal legal inquiries or questions regarding these Terms, please contact our compliance desk at{" "}
            <a href="mailto:nexguild.in@gmail.com" className="text-[#0D9488] font-bold hover:underline">
              nexguild.in@gmail.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}