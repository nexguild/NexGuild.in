import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],

  async redirects() {
    return [
      // Canonical: non-www → www (permanent 301)
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "nexguild.in" }],
        destination: "https://www.nexguild.in/:path*",
        permanent:   true,
      },
      // Old /blog/ paths → canonical /earn/blog/ (301 at edge, before page render)
      {
        source:      "/blog",
        destination: "/earn/blog",
        permanent:   true,
      },
      {
        source:      "/blog/:path*",
        destination: "/earn/blog/:path*",
        permanent:   true,
      },
    ];
  },
};

export default nextConfig;
