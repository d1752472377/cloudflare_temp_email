/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
}

// wrangler pages deploy 需要静态导出，通过环境变量控制
if (process.env.NEXT_OUTPUT_EXPORT === "true") {
  nextConfig.output = "export"
}

export default nextConfig
