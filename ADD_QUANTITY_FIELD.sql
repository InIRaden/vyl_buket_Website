-- SQL Script untuk menambahkan field quantity pada tabel orders
-- Jalankan script ini di database MySQL/MariaDB Anda

-- Tambahkan kolom quantity setelah customer_name
ALTER TABLE `orders` 
ADD COLUMN `quantity` INT NOT NULL DEFAULT 1 COMMENT 'Jumlah buket yang dipesan' 
AFTER `customer_name`;

-- Verifikasi perubahan
DESCRIBE `orders`;
