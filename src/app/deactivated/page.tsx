"use client";

export default function DeactivatedPage() {
  return (
    <div
      style={{ background: "#EBFBFA", minHeight: "100vh" }}
      className="w-full flex items-center justify-center px-4"
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{
          background:     "rgba(255, 255, 255, 0.65)",
          border:         "1.5px solid rgba(13,148,136,0.18)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="h-16 w-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-[#0F3D36] mb-2">Account Deactivated</h1>
        <p className="text-sm text-stone-600 mb-2">
          Your account has been deactivated and you have been signed out.
        </p>
        <p className="text-sm text-stone-600 mb-7">
          To reactivate your account, please contact our support team.
        </p>

        <a
          href="mailto:admin@nexguild.in"
          style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          Contact admin@nexguild.in
        </a>
      </div>
    </div>
  );
}
