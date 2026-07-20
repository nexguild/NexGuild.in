import Script from "next/script";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script
        src="https://5gvci.com/act/files/tag.min.js?z=11299073"
        data-cfasync="false"
        strategy="afterInteractive"
      />
      <Script
        id="monetag-inpage-push-blog"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(s){s.dataset.zone='11299133',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`
        }}
      />
    </>
  );
}
