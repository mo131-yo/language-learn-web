import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development"
});

export default withPWA(nextConfig);
