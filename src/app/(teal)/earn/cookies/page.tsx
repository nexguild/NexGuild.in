import type { Metadata } from "next";

export const metadata: Metadata = { 
  title: "Cookie Policy — NexGuild",
  description: "NexGuild uses cookies and similar technologies to keep you logged in and improve your experience.",
};

export default function CookiePolicyPage() {
  return (
    <div style={{ background: "#EBFBFA", color: "#1E293B", minHeight: "100vh" }} className="py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-[#0D9488] text-xs font-bold uppercase tracking-widest mb-3 italic">
          Last updated: June 2026
        </p>
        
        <h1 
          className="text-4xl sm:text-6xl font-black text-[#0F3D36] mb-8 tracking-tight"
          style={{ fontFamily: "'Instrument Serif', serif", lineHeight: "1.1" }}
        >
          Cookie Policy
        </h1>

        <div className="space-y-8 text-sm sm:text-base text-stone-600 leading-relaxed">
          <p className="text-stone-700 font-medium">
            This Cookie Policy explains how NexGuild (&quot;Platform&quot;, &quot;we&quot;, or &quot;us&quot;) uses cookies, web tokens, and identical tracking utilities to streamline your digital experience and maintain enterprise-grade protection across our contributor dashboards.
          </p>

          {/* Section 1 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              1. What Are Cookies and Tokens?
            </h2>
            <p>
              Cookies are small data scripts placed on your local browser directory when you load digital platforms. We also utilize JWTs (JSON Web Tokens) and local browser storage layers to optimize performance. These tracking strings do not damage your system hardware or execute rogue background processes; they simply allow our infrastructure to remember your active status.
            </p>
          </div>

          {/* Section 2 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              2. Essential Cookies and Session Management
            </h2>
            <p className="mb-3">
              Essential cookies are strictly required for the operational security and structural rendering of NexGuild. These cookies cannot be deactivated or declined manually within our core console, as the system requires them to stay functional.
            </p>
            <div className="overflow-x-auto my-4 rounded-xl border border-stone-200 bg-white/40 p-4">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-300 text-[#0F3D36] font-bold">
                    <th className="pb-2 pr-4">Cookie / Token Type</th>
                    <th className="pb-2">Primary Structural Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-stone-600 space-y-1">
                  <tr>
                    <td className="py-2 pr-4 font-semibold">Supabase Auth Session Token</td>
                    <td className="py-2">Validates your secure account login and prevents the dashboard from logging you out on page updates.</td>
                  </tr>
                  <tr className="border-t border-stone-200/50">
                    <td className="py-2 pr-4 font-semibold">CSRF Shield Security Keys</td>
                    <td className="py-2">Blocks Cross-Site Request Forgery attacks, guaranteeing that only you can submit your earnings data.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              3. Privacy-Friendly Performance Analytics
            </h2>
            <p>
              We occasionally employ lightweight, privacy-focused analytical logs to evaluate site speed, click-through rates, and task loading times. These logs do not store personal account credentials like your email or real name. They simply collect generalized patterns to help us understand which tasks are most popular and optimize the system structure.
            </p>
          </div>

          {/* Section 4 */}
          <div className="pt-4 border-t border-dashed border-stone-300/40">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F3D36] mb-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
              4. How to Control Cookies and Session Logs
            </h2>
            <p className="mb-3">
              Most web browsers accept cookies automatically. However, you maintain absolute control over your local browser setup. You can adjust your browser configurations to decline all cookies, wipe historical tracking data, or alert you when a new cookie is requested.
            </p>
            <p>
              Please note that if you choose to purge or block our essential authentication tokens, you will be instantly logged out, and you will be unable to access your contributor profile, complete active tasks, or request voucher redemptions until cookies are re-enabled.
            </p>
          </div>

          {/* Footer note */}
          <p className="text-xs text-stone-500 pt-6 border-t border-stone-300/60">
            For specific compliance metrics regarding our use of local storage tracking, contact us at{" "}
            <a href="mailto:admin@nexguild.in" className="text-[#0D9488] font-bold hover:underline">
              admin@nexguild.in
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}