# ⚡ Quick Reference - Deploy cPanel

## 🚀 Build & Deploy (Local - Windows)

```powershell
# Build dan package otomatis
.\build-deploy.ps1

# Output: vyl-bouquet-deploy.zip
```

---

## 📤 Upload ke cPanel

### Via File Manager:
1. Login cPanel → File Manager
2. Navigasi ke `public_html/`
3. Upload `vyl-bouquet-deploy.zip`
4. Extract file
5. Hapus zip

### Via SSH:
```bash
scp vyl-bouquet-deploy.zip user@vylbouquet.com:~/
ssh user@vylbouquet.com
cd ~/public_html
unzip ~/vyl-bouquet-deploy.zip
rm ~/vyl-bouquet-deploy.zip
```

---

## ⚙️ Setup di cPanel (Sekali Saja)

```bash
# 1. Install dependencies
cd ~/public_html
npm install --production

# 2. Install PM2
npm install -g pm2

# 3. Start aplikasi
pm2 start ecosystem.config.js --env production

# 4. Auto-start PM2
pm2 save
pm2 startup
```

---

## 🔄 Common Commands

```bash
# Restart aplikasi
pm2 restart vyl-bouquet

# Lihat logs
pm2 logs vyl-bouquet

# Monitor real-time
pm2 monit

# Stop aplikasi
pm2 stop vyl-bouquet

# Start aplikasi
pm2 start vyl-bouquet
```

---

## 🗄️ Database Commands

```bash
# Backup database
mysqldump -u user -p database > backup.sql

# Restore database
mysql -u user -p database < backup.sql

# Test connection
node -e "require('./src/lib/sequelize').testConnection()"
```

---

## 🔧 Troubleshooting Cepat

### Port sudah digunakan:
```bash
lsof -i :3000
kill -9 $(lsof -t -i:3000)
pm2 restart vyl-bouquet
```

### Out of Memory:
```bash
pm2 restart vyl-bouquet
# atau
pm2 restart vyl-bouquet --max-memory-restart 400M
```

### Database error:
```bash
# Cek credentials di .env
cat .env | grep DB_

# Test connection
mysql -u user -p database
```

---

## 📝 Environment Variables (cPanel)

Setup di cPanel → Setup Node.js App → Environment Variables:

```
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=username_vyl_bouquet_db
DB_USER=username_vylbouquet
DB_PASSWORD=your_password
JWT_SECRET=vylbouquet-secret-key-2024
NEXT_PUBLIC_BASE_URL=https://vylbouquet.com
```

---

## ✅ Checklist Deploy

- [ ] Build berhasil: `npm run build`
- [ ] `.env.production` sudah diisi
- [ ] Upload ke cPanel
- [ ] Extract files
- [ ] `npm install --production`
- [ ] Setup environment variables
- [ ] `pm2 start ecosystem.config.js`
- [ ] Test: `https://vylbouquet.com`
- [ ] SSL aktif (HTTPS)
- [ ] Test login admin
- [ ] Test upload gambar
- [ ] Test order flow

---

## 📞 Support URLs

- **Website**: https://vylbouquet.com
- **Admin**: https://vylbouquet.com/login
- **API Health**: https://vylbouquet.com/api/health
- **cPanel**: https://vylbouquet.com:2083

---

## 📖 Full Documentation

Lihat file lengkap: `DEPLOY_CPANEL.md`
