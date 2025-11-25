# 🚀 Panduan Deploy VYL Bouquet ke cPanel (Standalone Mode)

## 📋 Prerequisites

### Yang Harus Ada di cPanel:
- ✅ Node.js versi 18+ (Setup Node.js di cPanel)
- ✅ MySQL Database sudah dibuat
- ✅ PM2 installed (atau gunakan Passenger)
- ✅ SSH Access (opsional tapi sangat membantu)
- ✅ Domain: vylbouquet.com sudah pointing ke server

---

## 🔧 STEP 1: Persiapan di Local (Windows)

### 1.1 Update .env.production dengan Data cPanel

Edit file `.env.production` dan sesuaikan:

```bash
# Database dari cPanel
DB_HOST=localhost
DB_NAME=vylz6754_vyl_bouquet_db
DB_USER=vylz6754_vylbouquet
DB_PASSWORD=Vyl@bouquet_123

# URL Production
NEXT_PUBLIC_BASE_URL=https://vylbouquet.com
NEXTAUTH_URL=https://vylbouquet.com
```

### 1.2 Build Project untuk Production

Buka PowerShell di folder project:

```powershell
# Install dependencies
npm install

# Build untuk standalone mode
npm run build
```

**Output yang harus ada:**
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

**Folder yang tercipta:**
- `.next/standalone/` → Ini yang akan di-upload
- `.next/static/` → Static assets
- `public/` → Public files

### 1.3 Buat Package untuk Upload

```powershell
# Buat folder deployment
New-Item -ItemType Directory -Force -Path deploy

# Copy file-file penting
Copy-Item -Recurse .next/standalone/* deploy/
Copy-Item -Recurse .next/static deploy/.next/
Copy-Item -Recurse public deploy/
Copy-Item .env.production deploy/.env
Copy-Item server.js deploy/
Copy-Item ecosystem.config.js deploy/
Copy-Item .htaccess deploy/
Copy-Item package.json deploy/
Copy-Item package-lock.json deploy/

# Buat folder logs
New-Item -ItemType Directory -Force -Path deploy/logs

# Compress menjadi ZIP
Compress-Archive -Path deploy\* -DestinationPath vyl-bouquet-deploy.zip -Force
```

**File yang siap upload:** `vyl-bouquet-deploy.zip`

---

## 🌐 STEP 2: Setup Database di cPanel

### 2.1 Login ke cPanel

Akses: `https://vylbouquet.com:2083` atau via hosting provider

### 2.2 Buat Database MySQL

1. Masuk ke **MySQL Database Wizard**
2. Buat database baru: `vyl_bouquet_db`
3. Buat user: `vylbouquet` dengan password kuat
4. Berikan ALL PRIVILEGES ke user tersebut
5. Catat:
   - Database name: `username_vyl_bouquet_db` (dengan prefix)
   - Database user: `username_vylbouquet` (dengan prefix)
   - Password
   - Host: `localhost`

### 2.3 Import Database (jika ada data dari local)

1. Export database dari local:
   ```powershell
   # Dari XAMPP MySQL
   cd C:\xampp\mysql\bin
   .\mysqldump.exe -u root vyl_buket_db > vyl_bouquet_backup.sql
   ```

2. Di cPanel → **phpMyAdmin**
3. Pilih database yang baru dibuat
4. Klik **Import** → Upload file `vyl_bouquet_backup.sql`

---

## 📤 STEP 3: Upload ke cPanel

### Opsi A: Via File Manager (Recommended untuk Pemula)

1. Login cPanel → **File Manager**
2. Navigasi ke `public_html/`
3. Upload `vyl-bouquet-deploy.zip`
4. Klik kanan file → **Extract**
5. Hapus file zip setelah di-extract
6. Set permissions folder `public/uploads` → 755

### Opsi B: Via FTP (Alternatif)

1. Install FileZilla
2. Connect ke server FTP cPanel
3. Upload semua file dari folder `deploy/` ke `public_html/`
4. Tunggu sampai selesai

### Opsi C: Via SSH (Tercepat - jika akses SSH tersedia)

```bash
# Upload via SCP
scp vyl-bouquet-deploy.zip username@vylbouquet.com:~/

# Login SSH
ssh username@vylbouquet.com

# Extract
cd ~/public_html
unzip ~/vyl-bouquet-deploy.zip
rm ~/vyl-bouquet-deploy.zip

# Set permissions
chmod 755 public/uploads
```

---

## ⚙️ STEP 4: Setup Node.js di cPanel

### 4.1 Buka Setup Node.js App

1. cPanel → **Setup Node.js App**
2. Klik **Create Application**

### 4.2 Konfigurasi Aplikasi

```
Application Mode: Production
Application Root: public_html
Application URL: vylbouquet.com (atau kosongkan)
Application Startup File: server.js
Node.js Version: 18.x atau 20.x (pilih yang tersedia)
```

### 4.3 Environment Variables

Tambahkan environment variables di cPanel:

```
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=username_vyl_bouquet_db
DB_USER=username_vylbouquet
DB_PASSWORD=your_password
JWT_SECRET=vylbouquet-secret-key-production-2024
NEXT_PUBLIC_BASE_URL=https://vylbouquet.com
```

### 4.4 Install Dependencies

Di **Setup Node.js App** → Klik **Run NPM Install** atau via SSH:

```bash
cd ~/public_html
npm install --production
```

---

## 🚀 STEP 5: Start Aplikasi

### Opsi A: Via cPanel Node.js Manager (Passenger)

1. Di **Setup Node.js App** → Klik **Restart**
2. Tunggu beberapa detik
3. Status berubah jadi "Running"

### Opsi B: Via PM2 (Recommended untuk Kontrol Lebih)

```bash
# Via SSH
cd ~/public_html

# Install PM2 global (sekali saja)
npm install -g pm2

# Start aplikasi
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 auto-start saat server reboot
pm2 startup
# (ikuti instruksi yang muncul)

# Monitor
pm2 monit
```

**PM2 Commands:**
```bash
pm2 list              # List semua apps
pm2 logs vyl-bouquet  # Lihat logs
pm2 restart vyl-bouquet  # Restart app
pm2 stop vyl-bouquet  # Stop app
pm2 delete vyl-bouquet  # Hapus dari PM2
```

---

## 🔒 STEP 6: Setup SSL (HTTPS)

### 6.1 Install SSL Certificate

1. cPanel → **SSL/TLS Status**
2. Pilih domain: `vylbouquet.com`
3. Klik **Run AutoSSL** (Let's Encrypt - GRATIS)
4. Tunggu proses selesai

### 6.2 Force HTTPS

File `.htaccess` sudah include redirect HTTPS. Pastikan sudah ada di `public_html/`

---

## ✅ STEP 7: Testing & Verifikasi

### 7.1 Cek Aplikasi Berjalan

Buka browser: `https://vylbouquet.com`

**Yang harus dicek:**
- ✅ Homepage loading dengan benar
- ✅ Database connection berhasil
- ✅ Login admin berfungsi
- ✅ Upload gambar bekerja
- ✅ WhatsApp link bekerja

### 7.2 Cek Logs jika Ada Error

Via SSH:
```bash
# PM2 logs
pm2 logs vyl-bouquet

# Custom logs
tail -f ~/public_html/logs/pm2-error.log
tail -f ~/public_html/logs/pm2-out.log
```

Via cPanel:
- **Errors** → Lihat error logs
- **Metrics** → CPU & Memory usage

### 7.3 Test Database Connection

```bash
cd ~/public_html
node -e "require('./src/lib/sequelize').testConnection()"
```

### 7.4 Test Performance

1. Buka Chrome DevTools → Network
2. Reload halaman
3. Cek loading time
4. Cek memory usage di cPanel Metrics

---

## 📊 STEP 8: Monitoring & Maintenance

### Monitor Memory Usage

```bash
# Via PM2
pm2 monit

# Via htop (jika tersedia)
htop
```

### Auto Restart jika Memory Tinggi

File `ecosystem.config.js` sudah include:
```javascript
max_memory_restart: '400M'  // Auto restart jika > 400MB
cron_restart: '0 3 * * *'   // Restart setiap jam 3 pagi
```

### Backup Database (Otomatis)

Setup cron job di cPanel:
```bash
# Setiap hari jam 2 pagi
0 2 * * * mysqldump -u username_vylbouquet -p'password' username_vyl_bouquet_db > ~/backups/db_$(date +\%Y\%m\%d).sql
```

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'next'"

```bash
cd ~/public_html
npm install next react react-dom
```

### Error: "Port 3000 already in use"

```bash
# Cek process yang pakai port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Atau ganti port di .env
PORT=3001
```

### Error: "Out of Memory"

1. Cek memory usage: `pm2 monit`
2. Restart app: `pm2 restart vyl-bouquet`
3. Turunkan `max_memory_restart` di `ecosystem.config.js`
4. Hubungi provider untuk upgrade RAM

### Error: "Database connection failed"

1. Cek credentials di `.env`
2. Cek database di phpMyAdmin
3. Cek user privileges
4. Test connection:
   ```bash
   mysql -u username_vylbouquet -p -h localhost username_vyl_bouquet_db
   ```

### Static files tidak loading (CSS/JS)

1. Pastikan folder `.next/static` ter-copy dengan benar
2. Cek permissions: `chmod -R 755 .next/`
3. Clear browser cache
4. Cek `.htaccess` tidak blocking static files

---

## 🎯 Checklist Final

Sebelum go-live, pastikan:

- [x] ✅ `npm run build` berhasil tanpa error
- [x] ✅ `.env.production` sudah diisi lengkap
- [x] ✅ Database sudah dibuat di cPanel
- [x] ✅ File uploaded ke `public_html/`
- [x] ✅ Node.js app setup di cPanel
- [x] ✅ Dependencies installed (`npm install`)
- [x] ✅ Environment variables di-set
- [x] ✅ Aplikasi running (via PM2 atau Passenger)
- [x] ✅ SSL certificate installed
- [x] ✅ HTTPS redirect aktif
- [x] ✅ Domain accessible: https://vylbouquet.com
- [x] ✅ Login admin tested
- [x] ✅ Upload gambar tested
- [x] ✅ Order flow tested
- [x] ✅ WhatsApp integration tested

---

## 📞 Support

Jika ada masalah:

1. Cek logs: `pm2 logs vyl-bouquet`
2. Cek cPanel error logs
3. Restart aplikasi: `pm2 restart vyl-bouquet`
4. Contact hosting support untuk masalah server

---

## 🔄 Update Aplikasi (Deploy Update)

Untuk deploy update di masa depan:

1. Build ulang di local: `npm run build`
2. Compress folder `deploy/`
3. Upload & extract ke cPanel
4. Restart: `pm2 restart vyl-bouquet`

**Via SSH (lebih cepat):**
```bash
cd ~/public_html
git pull origin main  # jika pakai git
npm run build
pm2 restart vyl-bouquet
```

---

**🎉 Selamat! Aplikasi VYL Bouquet sudah online di https://vylbouquet.com**
