# Instalasi Fitur Screenshot Bukti Pesanan

## Dependency yang Dibutuhkan

Fitur screenshot otomatis membutuhkan library `html2canvas`. Jalankan perintah berikut:

```bash
npm install html2canvas
```

## Fitur yang Ditambahkan

### 1. Screenshot Otomatis
- Ketika halaman order-success dimuat, sistem akan **otomatis** mencoba screenshot dan download bukti pesanan
- Delay 1.5 detik untuk memastikan semua konten ter-render dengan baik
- Jika gagal (browser block, error, dll), tidak akan mengganggu user experience

### 2. Tombol Download Manual
- Button "Unduh Bukti Pesanan" dengan icon download
- User bisa klik kapan saja untuk download ulang
- Loading state saat proses download
- Pesan sukses setelah download berhasil

### 3. Peringatan Penting
- Banner kuning di atas halaman mengingatkan user untuk menyimpan bukti
- Keterangan "Simpan sebagai barang bukti pesanan Anda" di bawah button

## Format File Download

- **Format**: PNG (kualitas tinggi, scale 2x)
- **Nama File**: `Bukti-Pesanan-{ORDER_NUMBER}.png`
- **Konten**: 
  - Store branding (nama toko)
  - Detail pesanan lengkap
  - Ringkasan pembayaran
  - Preview pesan WhatsApp
  - Langkah selanjutnya

## Cara Kerja

1. User selesai order → redirect ke `/order-success`
2. Halaman load → tunggu 1.5 detik
3. Sistem otomatis capture area `orderDetailsRef` dan trigger download
4. Jika auto-download gagal (browser block, dll):
   - User tetap bisa lihat halaman normal
   - User bisa klik button "Unduh Bukti Pesanan" secara manual

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (mungkin perlu izin download manual)
- ⚠️ Mobile browsers (beberapa mungkin block auto-download)

## Fallback Strategy

Jika html2canvas gagal diinstall atau error:
1. User masih bisa screenshot manual (Print Screen)
2. User bisa copy pesan WhatsApp
3. Informasi tetap ditampilkan lengkap di halaman

## Testing

Setelah install, test dengan:
1. Buat order dummy
2. Cek apakah file PNG otomatis terdownload
3. Jika tidak otomatis, klik button "Unduh Bukti Pesanan"
4. Verifikasi file PNG berisi semua informasi order

## Troubleshooting

### Auto-download tidak jalan
- Normal jika browser block auto-download
- Gunakan button manual download
- Check browser settings untuk allow auto-download

### Screenshot kosong/putih
- Tunggu lebih lama (konten belum load)
- Check console untuk error
- Pastikan html2canvas terinstall dengan benar

### Error "Cannot read property of undefined"
- Pastikan sudah install: `npm install html2canvas`
- Restart dev server: `npm run dev`

## Catatan Penting

⚠️ **File screenshot hanya berisi data order yang sudah ter-render di halaman**
- Tidak menyimpan ke database
- Tidak ada backend API call
- User bertanggung jawab menyimpan file download

💡 **Best Practice**:
- Anjurkan user untuk juga save screenshot manual (backup)
- Kirim juga konfirmasi via email/WhatsApp jika memungkinkan
- Store order history di database untuk admin tracking
