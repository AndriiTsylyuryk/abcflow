/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure server-only code never leaks to client
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
  },

  // Image domains for provider results
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.klifgen.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
