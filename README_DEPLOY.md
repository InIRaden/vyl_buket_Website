# 🚀 VYL Bouquet - Deploy ke cPanel (Standalone Mode)

Panduan lengkap hosting Next.js 14 di cPanel menggunakan standalone mode untuk menghindari **Out of Memory**.

---

## 📖 Dokumentasi

| File | Deskripsi |
|------|-----------|
| **[DEPLOY_CPANEL.md](DEPLOY_CPANEL.md)** | 📘 Panduan lengkap step-by-step deployment |
| **[QUICK_DEPLOY.md](QUICK_DEPLOY.md)** | ⚡ Quick reference & cheat sheet |
| **[DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)** | ✅ Checklist & status deployment |
| **[cpanel-commands.sh](cpanel-commands.sh)** | 💻 SSH commands collection |

---

## ⚡ Quick Start

### 1️⃣ Build & Package (di Windows)

```powershell
# Jalankan script build otomatis
.\build-deploy.ps1
```

**Output:** `vyl-bouquet-deploy.zip` (~15-30 MB)

### 2️⃣ Upload ke cPanel

1. Login cPanel → **File Manager**
2. Navigasi ke `public_html/`
3. Upload `vyl-bouquet-deploy.zip`
4. Klik kanan → **Extract**
5. Hapus file zip

### 3️⃣ Setup Node.js App

1. cPanel → **Setup Node.js App**
2. **Create Application**:
   - Application Root: `public_html`
   - Startup File: `server.js`
   - Node.js Version: 18.x atau 20.x
3. **Add Environment Variables** (dari `.env.production`)
4. **Run NPM Install**

### 4️⃣ Start dengan PM2 (via SSH)

```bash
cd ~/public_html
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 5️⃣ Test

Buka: **https://vylbouquet.com** 🎉

---

## 🎯 Fitur Deployment

### ✅ Optimasi Memory
- Standalone output (hemat memory)
- Max memory: 512MB
- Auto restart jika > 400MB
- Database pool: max 3 connections

### ✅ Performance
- SWC minify enabled
- Static file caching
- Gzip compression
- Image optimization

### ✅ Security
- HTTPS redirect
- Security headers
- Protected .env files
- JWT authentication

### ✅ Monitoring
- PM2 auto-restart
- Cron restart (3 AM daily)
- Error & output logs
- Memory monitoring

---

## 📋 Requirements cPanel

- ✅ Node.js 18+ installed
- ✅ npm 9+ installed
- ✅ MySQL database ready
- ✅ PM2 support (recommended)
- ✅ SSH access (recommended)
- ✅ SSL certificate (Let's Encrypt)

---

## 🔧 File Konfigurasi Penting

### Production Environment (`.env.production`)
```bash
NODE_ENV=production
DB_HOST=localhost
DB_NAME=vylz6754_vyl_bouquet_db
DB_USER=vylz6754_vylbouquet
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
NEXT_PUBLIC_BASE_URL=https://vylbouquet.com
```

### Next.js Config (`next.config.js`)
```javascript
module.exports = {
  output: 'standalone', // WAJIB!
  // ... other configs
}
```

### PM2 Config (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'vyl-bouquet',
    script: './server.js',
    max_memory_restart: '400M',
    // ... other configs
  }]
}
```

---

## 🎯 Deployment Steps Detail

Lihat file **[DEPLOY_CPANEL.md](DEPLOY_CPANEL.md)** untuk panduan lengkap dengan:

- ✅ Persiapan local environment
- ✅ Build standalone output
- ✅ Setup database di cPanel
- ✅ Upload & extract files
- ✅ Configure Node.js app
- ✅ Install dependencies
- ✅ Setup PM2
- ✅ Configure SSL
- ✅ Testing & troubleshooting
- ✅ Monitoring & maintenance

---

## 🔄 Update Aplikasi

### Quick Update
```bash
cd ~/public_html
pm2 stop vyl-bouquet
# Upload & extract vyl-bouquet-deploy.zip baru
npm install --production
pm2 restart vyl-bouquet
```

### Via Git (Recommended)
```bash
cd ~/public_html
git pull origin main
npm install --production
npm run build
pm2 restart vyl-bouquet
```

---

## 📊 Monitoring

### PM2 Commands
```bash
pm2 list              # Status aplikasi
pm2 logs vyl-bouquet  # Lihat logs
pm2 monit             # Monitor real-time
pm2 restart vyl-bouquet  # Restart
```

### Check Memory
```bash
pm2 monit
# atau
free -h
```

### Check Database
```bash
node -e "require('./src/lib/sequelize').testConnection()"
```

---

## 🆘 Troubleshooting

### Out of Memory
```bash
pm2 restart vyl-bouquet
```

### Port Already in Use
```bash
kill -9 $(lsof -t -i:3000)
pm2 restart vyl-bouquet
```

### Database Connection Error
```bash
# Cek .env
cat .env | grep DB_

# Test connection
mysql -u user -p database
```

### Static Files 404
```bash
# Pastikan folder static ada
ls -la .next/static

# Set permissions
chmod -R 755 .next
```

Lihat lebih lengkap di **[DEPLOY_CPANEL.md](DEPLOY_CPANEL.md)** bagian Troubleshooting.

---

## 📞 Support

### URLs
- **Website**: https://vylbouquet.com
- **Admin**: https://vylbouquet.com/login
- **API Health**: https://vylbouquet.com/api/health
- **cPanel**: https://vylbouquet.com:2083

### Commands
```bash
pm2 logs vyl-bouquet    # Error logs
pm2 monit               # Resource monitoring
pm2 restart vyl-bouquet # Quick restart
```

---

## 📚 Additional Resources

- [Next.js Standalone Output](https://nextjs.org/docs/app/api-reference/next-config-js/output)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [cPanel Node.js Guide](https://docs.cpanel.net/knowledge-base/web-services/guide-to-nodejs/)

---

## ✨ Features

- 🌸 **Catalog Bouquet** - Browse & view bouquet gallery
- 📝 **Custom Orders** - Order dengan custom message & images
- 👤 **Admin Dashboard** - Manage products & orders
- 📊 **Statistics** - Sales & order analytics
- 📤 **WhatsApp Integration** - Direct order to WhatsApp
- 🖼️ **Image Upload** - Multiple image support
- 📱 **Responsive Design** - Mobile-friendly

---

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MySQL + Sequelize ORM
- **Styling**: Tailwind CSS
- **Authentication**: JWT + bcrypt
- **Deployment**: cPanel + PM2
- **Server**: Node.js 18+ (Standalone mode)

---

## 📝 License

Private - VYL Bouquet © 2024

---

**🎉 Ready untuk production! Jalankan `.\build-deploy.ps1` untuk mulai.**

Butuh bantuan? Baca **[DEPLOY_CPANEL.md](DEPLOY_CPANEL.md)** untuk panduan lengkap.
