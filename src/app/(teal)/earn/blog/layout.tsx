import Script from "next/script";

export default function EarnBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script
        src="https://5gvci.com/act/files/tag.min.js?z=11299073"
        data-cfasync="false"
        strategy="afterInteractive"
      />
    </>
  );
}
