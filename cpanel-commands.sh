# Quick Commands untuk Management di cPanel
# Copy-paste commands ini ke SSH terminal

# ============================================
# SETUP PERTAMA KALI
# ============================================

# 1. Extract deployment package
cd ~/public_html
unzip vyl-bouquet-deploy.zip
rm vyl-bouquet-deploy.zip

# 2. Install dependencies
npm install --production

# 3. Install PM2 (jika belum)
npm install -g pm2

# 4. Set permissions
chmod -R 755 .next
chmod -R 755 public/uploads

# 5. Start aplikasi
pm2 start ecosystem.config.js --env production

# 6. Save PM2 process list
pm2 save

# 7. Setup PM2 auto-start
pm2 startup
# (ikuti instruksi yang muncul)


# ============================================
# MONITORING
# ============================================

# Lihat status aplikasi
pm2 list

# Monitor real-time
pm2 monit

# Lihat logs
pm2 logs vyl-bouquet

# Lihat logs error saja
pm2 logs vyl-bouquet --err

# Lihat logs output saja
pm2 logs vyl-bouquet --out

# Clear logs
pm2 flush


# ============================================
# RESTART & RELOAD
# ============================================

# Restart aplikasi
pm2 restart vyl-bouquet

# Restart jika memory tinggi
pm2 restart vyl-bouquet --max-memory-restart 400M

# Reload tanpa downtime (jika cluster mode)
pm2 reload vyl-bouquet

# Stop aplikasi
pm2 stop vyl-bouquet

# Start aplikasi
pm2 start vyl-bouquet

# Delete dari PM2
pm2 delete vyl-bouquet


# ============================================
# DATABASE
# ============================================

# Login ke MySQL
mysql -u username_vylbouquet -p username_vyl_bouquet_db

# Backup database
mysqldump -u username_vylbouquet -p username_vyl_bouquet_db > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u username_vylbouquet -p username_vyl_bouquet_db < backup_20241125.sql

# Cek tables
mysql -u username_vylbouquet -p -e "USE username_vyl_bouquet_db; SHOW TABLES;"


# ============================================
# TROUBLESHOOTING
# ============================================

# Cek port yang digunakan
lsof -i :3000

# Kill process di port 3000
kill -9 $(lsof -t -i:3000)

# Cek memory usage
free -h

# Cek disk usage
df -h

# Cek CPU usage
top

# Test database connection
cd ~/public_html
node -e "require('./src/lib/sequelize').testConnection()"

# Cek Node.js version
node -v

# Cek npm version
npm -v

# Cek PM2 version
pm2 -v


# ============================================
# UPDATE APLIKASI
# ============================================

# Method 1: Upload zip baru
cd ~/public_html
pm2 stop vyl-bouquet
# Upload dan extract vyl-bouquet-deploy.zip
unzip -o vyl-bouquet-deploy.zip
npm install --production
pm2 restart vyl-bouquet

# Method 2: Via Git (jika setup Git)
cd ~/public_html
pm2 stop vyl-bouquet
git pull origin main
npm install --production
npm run build
pm2 restart vyl-bouquet


# ============================================
# MAINTENANCE
# ============================================

# Clear npm cache
npm cache clean --force

# Update PM2
npm update -g pm2

# Restart PM2 daemon
pm2 kill
pm2 resurrect

# Clear logs yang besar
pm2 flush
> logs/pm2-error.log
> logs/pm2-out.log


# ============================================
# SECURITY
# ============================================

# Ganti permission file .env
chmod 600 .env

# Cek file permissions
ls -la

# Protect sensitive files (sudah ada di .htaccess)
# Pastikan .htaccess aktif


# ============================================
# CRON JOBS (Setup di cPanel)
# ============================================

# Auto backup database (setiap hari jam 2 pagi)
# 0 2 * * * cd ~/public_html && mysqldump -u username_vylbouquet -p'password' username_vyl_bouquet_db > ~/backups/db_$(date +\%Y\%m\%d).sql

# Auto restart PM2 (setiap hari jam 3 pagi)
# 0 3 * * * pm2 restart vyl-bouquet

# Clear old logs (setiap minggu)
# 0 4 * * 0 cd ~/public_html && pm2 flush
