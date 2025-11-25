'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../hooks/useAuth';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const showToast = useToast(); // Toast notifications
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    payment_bca: '',
    payment_bca_desc: '',
    payment_seabank: '',
    payment_seabank_desc: '',
    payment_shopeepay: '',
    payment_shopeepay_desc: '',
    whatsapp_number: '',
  });

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      console.log('Raw settings data:', data.data); // Debug log

      if (data.success) {
        // Safely extract values and descriptions, ensuring they're strings not objects
        const extractValue = (item) => {
          if (!item) return '';
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item.value !== undefined) return String(item.value || '');
          return '';
        };
        
        const extractDescription = (item) => {
          if (!item) return '';
          if (typeof item === 'object' && item.description !== undefined) return String(item.description || '');
          return '';
        };
        
        const newSettings = {
          payment_bca: extractValue(data.data.payment_bca),
          payment_bca_desc: extractDescription(data.data.payment_bca),
          payment_seabank: extractValue(data.data.payment_seabank),
          payment_seabank_desc: extractDescription(data.data.payment_seabank),
          payment_shopeepay: extractValue(data.data.payment_shopeepay),
          payment_shopeepay_desc: extractDescription(data.data.payment_shopeepay),
          whatsapp_number: extractValue(data.data.whatsapp_number),
        };
        
        console.log('Extracted settings:', newSettings); // Debug log
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
      showToast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchSettings();
    }
  }, [user, authLoading, router]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format WhatsApp number
    if (name === 'whatsapp_number') {
      let formattedValue = value.replace(/\D/g, ''); // Remove non-numeric characters
      
      // Convert 08xxx to 628xxx
      if (formattedValue.startsWith('0')) {
        formattedValue = '62' + formattedValue.substring(1);
      }
      // Keep 62xxx format
      else if (formattedValue.startsWith('62')) {
        formattedValue = formattedValue;
      }
      // Add 62 prefix if missing
      else if (formattedValue.length > 0 && !formattedValue.startsWith('62')) {
        formattedValue = '62' + formattedValue;
      }
      
      setSettings(prev => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi
    if (!settings.payment_bca && !settings.payment_seabank && !settings.payment_shopeepay) {
      showToast.error('Minimal satu metode pembayaran harus diisi');
      return;
    }

    // Validasi WhatsApp number format
    if (settings.whatsapp_number) {
      if (!settings.whatsapp_number.startsWith('62')) {
        showToast.error('Nomor WhatsApp harus dimulai dengan 62');
        return;
      }
      if (settings.whatsapp_number.length < 10 || settings.whatsapp_number.length > 15) {
        showToast.error('Nomor WhatsApp tidak valid (10-15 digit)');
        return;
      }
    }

    try {
      setSaving(true);
      
      // Prepare data dengan struktur value dan description
      const settingsData = {
        payment_bca: { value: settings.payment_bca, description: settings.payment_bca_desc },
        payment_seabank: { value: settings.payment_seabank, description: settings.payment_seabank_desc },
        payment_shopeepay: { value: settings.payment_shopeepay, description: settings.payment_shopeepay_desc },
        whatsapp_number: settings.whatsapp_number,
      };
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });

      const data = await response.json();

      if (data.success) {
        showToast.success('Pengaturan berhasil disimpan');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Save settings error:', error);
      showToast.error('Gagal menyimpan pengaturan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pengaturan Pembayaran & Ketentuan</h1>
        <p className="text-gray-600 mt-1 text-xs sm:text-sm">Kelola informasi pembayaran dan ketentuan pemesanan</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Metode Pembayaran</h2>
          
          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">BCA</h3>
            <div className="mb-3">
              <Input
                label="Nomor Rekening BCA"
                name="payment_bca"
                value={settings.payment_bca}
                onChange={handleChange}
                placeholder="3741159803"
              />
            </div>
            <div>
              <Input
                label="Nama Pemilik Rekening BCA"
                name="payment_bca_desc"
                value={settings.payment_bca_desc}
                onChange={handleChange}
                placeholder="Muhammad Nashirul Haq Resa"
              />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">SeaBank</h3>
            <div className="mb-3">
              <Input
                label="Nomor Rekening SeaBank"
                name="payment_seabank"
                value={settings.payment_seabank}
                onChange={handleChange}
                placeholder="901763996563"
              />
            </div>
            <div>
              <Input
                label="Nama Pemilik Rekening SeaBank"
                name="payment_seabank_desc"
                value={settings.payment_seabank_desc}
                onChange={handleChange}
                placeholder="Muhammad Nashirul Haq Resa"
              />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3">ShopeePay</h3>
            <div className="mb-3">
              <Input
                label="Nomor ShopeePay"
                name="payment_shopeepay"
                value={settings.payment_shopeepay}
                onChange={handleChange}
                placeholder="085161553414"
              />
            </div>
            <div>
              <Input
                label="Nama Pemilik ShopeePay"
                name="payment_shopeepay_desc"
                value={settings.payment_shopeepay_desc}
                onChange={handleChange}
                placeholder="Muhammad Nashirul Haq Resa"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-pink-500 font-medium">💡 Catatan: Transfer ShopeePay dari bank dikenakan biaya admin +Rp 1.000</p>
          </div>
        </div>

        {/* WhatsApp Number */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Kontak WhatsApp</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nomor WhatsApp <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <input
                  type="tel"
                  name="whatsapp_number"
                  value={settings.whatsapp_number}
                  onChange={handleChange}
                  placeholder="08123456789 atau 628123456789"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all text-sm sm:text-base"
                />
              </div>
            </div>
            
            {/* Format Preview */}
            {settings.whatsapp_number && typeof settings.whatsapp_number === 'string' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-800 mb-1">Format Tersimpan:</p>
                    <p className="text-sm font-mono font-semibold text-green-700">+{String(settings.whatsapp_number)}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Link WhatsApp: wa.me/{String(settings.whatsapp_number)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Helper Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-800 mb-1">Cara Penggunaan:</p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>Ketik nomor dengan awalan <span className="font-semibold">08</span> (contoh: 08123456789)</li>
                    <li>Sistem otomatis mengubah ke format internasional <span className="font-semibold">62</span></li>
                    <li>Atau langsung ketik dengan <span className="font-semibold">62</span> (contoh: 628123456789)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:bg-pink-600 active:bg-pink-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed w-full max-w-md flex items-center justify-center gap-2 text-sm sm:text-base touch-target"
          >
            <span>💾</span>
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
}
