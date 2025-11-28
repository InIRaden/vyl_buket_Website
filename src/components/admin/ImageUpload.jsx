'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useToast } from '../../hooks/useToast';

export default function ImageUpload({ value, onChange, disabled = false }) {
  const showToast = useToast(); // Toast notifications
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const fileInputRef = useRef(null);

  // Reset preview when value changes from parent (e.g., modal reopen)
  useEffect(() => {
    setPreview(value || null);
    // Reset file input if value is null
    if (!value && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [value]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast.error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP');
      return;
    }

    // Validasi ukuran (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast.error('Ukuran file terlalu besar. Maksimal 2MB');
      return;
    }

    try {
      setUploading(true);

      // Preview lokal
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload ke server
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onChange(data.url);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast.error('Gagal upload gambar: ' + error.message);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
          id="image-upload"
        />
        
        <label
          htmlFor="image-upload"
          className={`px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
            disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? 'Uploading...' : 'Pilih Gambar'}
        </label>

        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
          >
            Hapus
          </button>
        )}
      </div>

      {preview && (
        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain"
          />
        </div>
      )}

      <p className="text-sm text-gray-500">
        Format: JPG, PNG, WEBP. Maksimal 2MB.
      </p>
    </div>
  );
}
