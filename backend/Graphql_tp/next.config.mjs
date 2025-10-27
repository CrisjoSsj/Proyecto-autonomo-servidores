/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Cambiado temporalmente para ver errores
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
