/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
  async redirects() {
    return [{ source: "/request-access", destination: "/signup", permanent: true }];
  }
};
export default nextConfig;
