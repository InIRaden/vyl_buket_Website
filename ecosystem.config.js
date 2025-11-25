module.exports = {
  apps: [{
    name: 'vyl-bouquet',
    script: './server.js',
    
    // Instance settings
    instances: 1,
    exec_mode: 'fork', // Fork mode untuk hemat memory (bukan cluster)
    
    // Environment
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    
    // Memory & CPU limits (PENTING untuk cPanel!)
    max_memory_restart: '400M', // Restart jika memory > 400MB
    node_args: '--max-old-space-size=512', // Max memory 512MB
    
    // Logs
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    
    // Auto restart settings
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Cron restart (setiap hari jam 3 pagi)
    cron_restart: '0 3 * * *',
    
    // Environment variables from .env file
    env_file: '.env.production',
  }]
}
