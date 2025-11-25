const path = require('path');

// Environment setup
const dir = path.join(__dirname);
process.env.NODE_ENV = 'production';
process.chdir(__dirname);

// Server configuration
const currentPort = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || '0.0.0.0';
const keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10) || 5000;

// Next.js config untuk standalone
const nextConfig = {
  env: {},
  distDir: './.next',
  cleanDistDir: true,
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['localhost', 'vylbouquet.com', 'www.vylbouquet.com'],
    unoptimized: true,
    minimumCacheTTL: 60,
  },
  
  httpAgentOptions: {
    keepAlive: true,
  },
  
  experimental: {
    cpus: 1, // Limit CPU usage untuk cPanel
    memoryBasedWorkersCount: false,
    isrFlushToDisk: true,
  }
};

// Set config untuk Next.js
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

// Start server dengan error handling
console.log('🚀 Starting VYL Bouquet Production Server...');
console.log('📍 Port:', currentPort);
console.log('🌐 Hostname:', hostname);
console.log('💾 Memory limit:', process.env.NODE_OPTIONS);

try {
  require('next');
  const { startServer } = require('next/dist/server/lib/start-server');

  startServer({
    dir,
    isDev: false,
    config: nextConfig,
    hostname,
    port: currentPort,
    allowRetry: false,
    keepAliveTimeout,
  })
  .then(() => {
    console.log('✅ Server started successfully');
    console.log(`🔗 URL: http://${hostname}:${currentPort}`);
  })
  .catch((err) => {
    console.error('❌ Server start error:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('❌ Fatal error:', err);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
