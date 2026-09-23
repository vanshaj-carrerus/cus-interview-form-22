import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones on the local Wi-Fi use the dev server (e.g. after scanning the /qr code).
  allowedDevOrigins: ["192.168.1.43"],
};

export default nextConfig;
