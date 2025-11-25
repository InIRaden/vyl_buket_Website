# ✅ VYL Bouquet - Deployment Checklist

## 🎯 Status: Ready untuk Deploy ke cPanel (Standalone Mode)

---

## 📦 File Konfigurasi yang Sudah Dibuat

### ✅ Core Configuration
- [x] `next.config.js` - Standalone mode enabled
- [x] `server.js` - Production server dengan error handling
- [x] `.env.production` - Environment variables untuk production
- [x] `ecosystem.config.js` - PM2 configuration
- [x] `.htaccess` - Apache proxy & security headers
- [x] `.npmrc` - NPM optimization
- [x] `.cpanel.yml` - Auto-deployment config (opsional)

### ✅ Database & Models
- [x] `src/lib/sequelize.js` - Optimized untuk cPanel (max 3 connections)
- [x] `src/models/*.js` - Semua models updated untuk production

### ✅ Scripts & Tools
- [x] `build-deploy.ps1` - Windows PowerShell build script
- [x] `cpanel-commands.sh` - SSH command reference
- [x] `package.json` - Scripts untuk PM2 & production

### ✅ Documentation
- [x] `DEPLOY_CPANEL.md` - Full deployment guide (lengkap)
- [x] `QUICK_DEPLOY.md` - Quick reference guide
- [x] `.gitignore` - Updated untuk deployment files

---

## 🚀 Cara Deploy (Ringkasan)

### Step 1: Build di Local (Windows)
```powershell
# Jalankan script otomatis
.\build-deploy.ps1

# Output: vyl-bouquet-deploy.zip
```

### Step 2: Upload ke cPanel
- Login cPanel → File Manager
- Navigate ke `public_html/`
- Upload `vyl-bouquet-deploy.zip`
- Extract file
- Hapus zip

### Step 3: Setup di cPanel (SSH)
```bash
cd ~/public_html
npm install --production
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
```

### Step 4: Configure Environment
Setup di cPanel → Setup Node.js App:
- Application Root: `public_html`
- Startup File: `server.js`
- Node.js Version: 18.x atau 20.x
- Add environment variables dari `.env.production`

### Step 5: Test
- Buka: https://vylbouquet.com
- Test login admin
- Test upload gambar
- Test order flow

---

## 🔧 Optimasi untuk cPanel

### Memory Management
- ✅ Max memory: 512MB (`NODE_OPTIONS=--max-old-space-size=512`)
- ✅ Auto restart jika memory > 400MB
- ✅ Database connection pool: max 3 connections
- ✅ Fork mode (bukan cluster) untuk hemat memory

### Performance
- ✅ Standalone output (lebih hemat memory)
- ✅ SWC Minify enabled
- ✅ Image unoptimized (hemat CPU)
- ✅ Compression enabled
- ✅ Static files caching

### Security
- ✅ HTTPS redirect
- ✅ Security headers (X-Frame-Options, CSP, dll)
- ✅ Protected .env files
- ✅ JWT authentication

### Monitoring
- ✅ PM2 auto-restart
- ✅ Cron restart setiap hari jam 3 pagi
- ✅ Error & output logs
- ✅ Memory monitoring

---

## 📋 Pre-Deployment Checklist

### Database
- [ ] Database sudah dibuat di cPanel MySQL
- [ ] User & password sudah dicatat
- [ ] Privileges sudah di-set (ALL PRIVILEGES)
- [ ] Data sudah di-export dari local (jika ada)
- [ ] Update credentials di `.env.production`

### Domain & SSL
- [ ] Domain vylbouquet.com sudah pointing ke server
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] HTTPS redirect aktif

### Files
- [ ] Build berhasil: `npm run build`
- [ ] Folder `.next/standalone/` ada
- [ ] `vyl-bouquet-deploy.zip` sudah dibuat
- [ ] File size reasonable (< 100MB)

### Environment Variables
- [ ] DB_HOST, DB_NAME, DB_USER, DB_PASSWORD updated
- [ ] JWT_SECRET sudah diganti (jangan pakai default!)
- [ ] NEXTAUTH_SECRET sudah diganti
- [ ] NEXT_PUBLIC_BASE_URL = https://vylbouquet.com
- [ ] WHATSAPP credentials (jika digunakan)

---

## 🎯 Post-Deployment Testing

### Basic Functionality
- [ ] Homepage loading (https://vylbouquet.com)
- [ ] Admin login (https://vylbouquet.com/login)
- [ ] Catalog page loading
- [ ] Order page loading

### Admin Features
- [ ] Login dengan credentials admin
- [ ] Dashboard stats tampil
- [ ] List bouquets tampil
- [ ] Add/Edit bouquet
- [ ] Upload gambar bouquet
- [ ] List orders tampil
- [ ] View order detail
- [ ] Update order status
- [ ] Settings page

### Customer Features
- [ ] Browse catalog
- [ ] View bouquet detail
- [ ] Add to cart (order form)
- [ ] Upload custom images
- [ ] Submit order
- [ ] WhatsApp redirect bekerja

### Performance
- [ ] Page load < 3 seconds
- [ ] Memory usage < 400MB (via `pm2 monit`)
- [ ] CPU usage normal
- [ ] No error di logs (`pm2 logs`)

---

## 🔗 URLs Penting

- **Website**: https://vylbouquet.com
- **Admin Login**: https://vylbouquet.com/login
- **API Health**: https://vylbouquet.com/api/health
- **cPanel**: https://vylbouquet.com:2083
- **phpMyAdmin**: https://vylbouquet.com:2083/phpMyAdmin

---

## 📞 Troubleshooting Quick Links

### Common Issues
1. **Out of Memory**: `pm2 restart vyl-bouquet`
2. **Database Error**: Cek credentials di `.env`
3. **Port in Use**: `kill -9 $(lsof -t -i:3000)`
4. **Static Files 404**: Cek folder `.next/static` ter-copy
5. **SSL Error**: Install SSL di cPanel → SSL/TLS Status

### Support Commands
```bash
# Logs
pm2 logs vyl-bouquet

# Monitor
pm2 monit

# Restart
pm2 restart vyl-bouquet

# Database test
node -e "require('./src/lib/sequelize').testConnection()"
```

---

## ✨ Fitur Tambahan (Opsional)

### Auto Backup Database
Setup cron job di cPanel:
```bash
0 2 * * * mysqldump -u user -p'pass' database > ~/backups/db_$(date +\%Y\%m\%d).sql
```

### Git Deployment
Untuk update lebih mudah di masa depan:
```bash
cd ~/public_html
git init
git remote add origin https://github.com/yourusername/vyl-bouquet.git
```

Update via Git:
```bash
git pull origin main
npm install --production
npm run build
pm2 restart vyl-bouquet
```

---

## 📚 Documentation Files

1. **DEPLOY_CPANEL.md** - Full deployment guide (baca ini dulu!)
2. **QUICK_DEPLOY.md** - Quick reference card
3. **cpanel-commands.sh** - SSH commands collection
4. **build-deploy.ps1** - Build & package script

---

**🎉 Project sudah 100% ready untuk production!**

Jalankan `.\build-deploy.ps1` untuk mulai deployment.
