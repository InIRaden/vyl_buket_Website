'use client';

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ImageUpload from './ImageUpload';
import { useToast } from '../../hooks/useToast';

export default function BouquetModal({ isOpen, onClose, mode = 'create', bouquet = null, onSuccess }) {
  const showToast = useToast(); // Toast notifications
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image_url: null,
    is_active: true,
  });

  // Reset form ketika modal dibuka/tutup atau mode berubah
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && bouquet) {
        setFormData({
          name: bouquet.name || '',
          price: bouquet.price || '',
          description: bouquet.description || '',
          image_url: bouquet.image_url || null,
          is_active: bouquet.is_active !== undefined ? bouquet.is_active : true,
        });
      } else {
        setFormData({
          name: '',
          price: '',
          description: '',
          image_url: null,
          is_active: true,
        });
      }
    }
  }, [isOpen, mode, bouquet]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for price input with rupiah formatting
    if (name === 'price') {
      // Remove all non-digit characters
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue,
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Format price for display with Rupiah formatting
  const formatPriceInput = (value) => {
    if (!value) return '';
    // Add thousand separators
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleImageChange = (url) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi
    if (!formData.name.trim()) {
      showToast.error('Nama buket harus diisi');
      return;
    }

    if (!formData.price || isNaN(parseFloat(formData.price))) {
      showToast.error('Harga harus diisi dengan angka yang valid');
      return;
    }

    try {
      setLoading(true);

      const url = mode === 'create' 
        ? '/api/bouquets' 
        : `/api/bouquets/${bouquet.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showToast.success(mode === 'create' ? 'Buket berhasil ditambahkan' : 'Buket berhasil diupdate');
        onSuccess?.();
        onClose();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Submit error:', error);
      showToast.error('Terjadi kesalahan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Tambah Buket Baru' : 'Edit Buket'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gambar Buket
            </label>
            <ImageUpload
              value={formData.image_url}
              onChange={handleImageChange}
              disabled={loading}
            />
          </div>

          {/* Right Column - Form Fields */}
          <div className="space-y-4">
            {/* Nama Buket */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Buket <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Contoh: Buket Mawar Merah"
                required
                disabled={loading}
              />
            </div>

            {/* Harga */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Harga <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium text-sm sm:text-base z-10">
                  Rp
                </span>
                <input
                  id="price"
                  name="price"
                  type="text"
                  value={formatPriceInput(formData.price)}
                  onChange={handleChange}
                  placeholder="150.000"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed touch-target"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Status Aktif */}
            <div className="flex items-center gap-2 pt-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={loading}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Tampilkan di katalog customer
              </label>
            </div>
          </div>
        </div>

        {/* Deskripsi - Full Width */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi (Opsional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Deskripsi buket..."
            rows={4}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : mode === 'create' ? 'Tambah Buket' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
