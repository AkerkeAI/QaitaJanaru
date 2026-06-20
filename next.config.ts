import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // В Next.js 15 это свойство пишется на верхнем уровне, без experimental!
  allowedDevOrigins: ["192.168.8.1",
                      "192.168.8.23",
  ]
};

export default nextConfig;