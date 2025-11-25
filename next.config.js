/** @type {import('next').NextConfig} */
const nextConfig = {
  // WAJIB: Enable standalone mode untuk cPanel
  output: 'standalone',
  
  // Optimasi production
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  
  // Image configuration
  images: {
    domains: ['localhost', 'vylbouquet.com', 'www.vylbouquet.com'],
    unoptimized: true, // Untuk cPanel dengan memory terbatas
    minimumCacheTTL: 60,
  },
  
  // Environment variables untuk client
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://vylbouquet.com',
  },
  
  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude database packages from webpack bundling
      config.externals.push({
        sequelize: 'commonjs sequelize',
        mysql2: 'commonjs mysql2',
      });
    }
    
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      minimize: true,
    };
    
    return config;
  },
  
  // Experimental features untuk optimasi
  experimental: {
    optimizePackageImports: ['react-hot-toast', '@heroicons/react'],
  },
};

module.exports = nextConfig;
