"use client";

import Link from 'next/link';
import NavBar from '../../../components/ui/NavBar';
import Footer from '../../../components/ui/Footer';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useRef } from 'react';
import html2canvas from 'html2canvas';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('order_id');
  const orderNumberParam = searchParams.get('order_number');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [settings, setSettings] = useState(null);
  const [copied, setCopied] = useState(false);
  const [autoScreenshotDone, setAutoScreenshotDone] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const orderDetailsRef = useRef(null);

  // Fetch settings untuk WhatsApp number
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      setUsedFallback(false);

      try {
        // PRIORITY 1: Cek data dari URL query params
        const dataParam = searchParams.get('data');
        if (dataParam) {
          try {
            const decoded = decodeURIComponent(atob(dataParam));
            const orderData = JSON.parse(decoded);
            if (orderData && Object.keys(orderData).length > 0) {
              setOrder(orderData);
              setUsedFallback(false);
              setLoading(false);
              // Clear localStorage setelah berhasil
              try { localStorage.removeItem('lastOrder'); localStorage.removeItem('lastOrderId'); } catch (e) {}
              return;
            }
          } catch (err) {
            console.warn('Failed to decode order data from URL', err);
            // Lanjutkan ke fallback berikutnya
          }
        }

        // PRIORITY 2: Cek dari localStorage (lastOrder object)
        try {
          const raw = localStorage.getItem('lastOrder');
          if (raw) {
            const local = JSON.parse(raw);
            if (local && Object.keys(local).length > 0) {
              setOrder(local);
              setUsedFallback(true);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Could not read lastOrder from localStorage', err);
        }

        // PRIORITY 3: Cek dari database menggunakan identifier
        let identifier = orderNumberParam || orderIdParam || null;

        if (!identifier) {
          try {
            const savedId = localStorage.getItem('lastOrderId');
            if (savedId) identifier = savedId;
          } catch (err) {
            console.warn('Could not read lastOrderId', err);
          }
        }

        if (!identifier) {
          setError('Data pesanan tidak ditemukan. Silakan hubungi admin.');
          setLoading(false);
          return;
        }

        // Build API URL
        let url = '';
        if (/^\d+$/.test(identifier)) {
          url = `/api/orders/${identifier}`;
        } else {
          url = `/api/orders?order_number=${encodeURIComponent(identifier)}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok) {
          let result = data.data || data;
          if (Array.isArray(result) && result.length > 0) result = result[0];
          if (result && Object.keys(result).length > 0) {
            setOrder(result);
            setLoading(false);
            // Clear local temporary storage to avoid reuse
            try { localStorage.removeItem('lastOrder'); localStorage.removeItem('lastOrderId'); } catch (e) {}
            return;
          }
        }

        throw new Error(data?.message || 'Gagal mengambil data pesanan dari server');
      } catch (err) {
        console.error(err);
        setError(err.message || 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderIdParam, orderNumberParam, searchParams]);

  const formatPrice = (price) => {
    if (price == null) return 'Rp ...';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  };

  // Calculate payment summary based on order data
  // bouquet_price sudah termasuk quantity * harga per buket + biaya admin (jika ada)
  const total = order?.bouquet_price || 0;
  
  // Hitung subtotal dan surcharge untuk breakdown
  const pricePerBouquet = order?.bouquet?.price || 0;
  const quantity = order?.quantity || 1;
  const subtotal = pricePerBouquet * quantity;
  const surcharge = total - subtotal; // Biaya admin (jika ada)
  
  // Hitung jumlah yang dibayar berdasarkan payment_type
  let paid = 0;
  if (order?.payment_type === 'DP') {
    // Jika DP, yang dibayar adalah dp_amount (30% dari total)
    paid = order?.dp_amount || (total * 0.3);
  } else if (order?.payment_type === 'FULL') {
    // Jika lunas, yang dibayar adalah total (sudah termasuk quantity + biaya admin)
    paid = total;
  }
  
  // Sisa pembayaran
  const remaining = order?.remaining_amount || Math.max(0, total - paid);

  // Generate WhatsApp URL using settings from API
  let whatsappUrl = '';
  let whatsappMessage = '';
  
  if (order && settings) {
    // Extract WhatsApp number from settings
    const waData = settings?.whatsapp_number;
    const whatsappNumber = (typeof waData === 'object' && waData?.value) 
      ? waData.value 
      : (typeof waData === 'string' ? waData : null);
    
    if (whatsappNumber) {
      const { formatOrderWhatsAppMessage } = require('../../../lib/whatsapp');
      // Pass the complete order object directly, formatOrderWhatsAppMessage will handle it
      whatsappMessage = formatOrderWhatsAppMessage(order, settings);
      whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    }
  }

  // Copy to clipboard handler
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      const timeout = 2000; // 2 seconds
      setTimeout(() => setCopied(false), timeout);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get brand/store name from settings
  const storeName = settings?.store_name?.value || settings?.store_name || 'vyl.bouquet';

  // Show instruction modal on page load
  useEffect(() => {
    if (!loading && !error && order) {
      // Show modal after a short delay
      const timer = setTimeout(() => {
        setShowInstructionModal(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, error, order]);

  // Auto-screenshot functionality
  useEffect(() => {
    if (!loading && !error && order && orderDetailsRef.current && !autoScreenshotDone) {
      // Wait a bit for all images/content to render
      const timer = setTimeout(async () => {
        try {
          await handleDownloadProof(true); // true = auto mode
          setAutoScreenshotDone(true);
        } catch (err) {
          console.warn('Auto-screenshot failed, user can manually download:', err);
          setAutoScreenshotDone(true); // Mark as done even if failed
        }
      }, 1500); // 1.5 second delay for content to fully render

      return () => clearTimeout(timer);
    }
  }, [loading, error, order, autoScreenshotDone]);

  // Download proof handler
  const handleDownloadProof = async (isAuto = false) => {
    if (!orderDetailsRef.current) return;
    
    setIsDownloading(true);
    
    try {
      const canvas = await html2canvas(orderDetailsRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Convert to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fileName = `Bukti-Pesanan-${order?.order_number || order?.id || 'Order'}.png`;
        
        link.href = url;
        link.download = fileName;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        URL.revokeObjectURL(url);
        
        if (!isAuto) {
          // Show success message for manual download
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }, 'image/png');
      
    } catch (err) {
      console.error('Screenshot failed:', err);
      
      if (!isAuto) {
        alert('Gagal mengunduh bukti pesanan. Silakan screenshot manual atau hubungi admin.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 my-12 font-serif">
      <div className="relative z-20">
        <NavBar />
      </div>

      {/* Instruction Modal */}
      {showInstructionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full transform animate-slideUp">
            {/* Header with logo */}
            <div className="border-b border-gray-200 p-4 text-center">
              <div className="flex justify-center mb-2">
                <img 
                  src="/logo-removebg-preview.png" 
                  alt="vylbouquet" 
                  className="h-12 w-auto"
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Pesanan Berhasil Dibuat</h2>
              <p className="text-gray-600 text-xs">Selesaikan 4 langkah berikut untuk memastikan pesanan Anda diproses</p>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="space-y-2.5 mb-4">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all">
                  <div className="flex-shrink-0 w-7 h-7 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Salin Format Pesanan</p>
                    <p className="text-xs text-gray-600">Scroll ke bawah dan klik tombol "Salin Pesan"</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all">
                  <div className="flex-shrink-0 w-7 h-7 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Hubungi Admin via WhatsApp</p>
                    <p className="text-xs text-gray-600">Klik tombol hijau "Hubungi via WhatsApp"</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all">
                  <div className="flex-shrink-0 w-7 h-7 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Kirim Format ke Admin</p>
                    <p className="text-xs text-gray-600">Paste dan kirim format pesanan ke chat WhatsApp</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all">
                  <div className="flex-shrink-0 w-7 h-7 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Simpan Bukti Pesanan</p>
                    <p className="text-xs text-gray-600">Klik "Unduh Bukti Pesanan" untuk menyimpan</p>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-bold text-red-900 text-xs mb-0.5">PENTING</p>
                    <p className="text-xs text-red-800">Pesanan hanya akan diproses setelah Anda mengirim format pesanan via WhatsApp kepada admin kami.</p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowInstructionModal(false)}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-6 pt-20">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">Pesanan Berhasil!</h1>
          <p className="text-amber-700 mb-6">Pesanan Anda telah kami terima dan sedang diproses</p>
          
          {/* Important Notice */}
          <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-semibold text-yellow-800 mb-1">Penting!</p>
                <p className="text-xs text-yellow-700">
                  Simpan bukti pesanan ini sebagai barang bukti. Screenshot akan otomatis terunduh, atau klik tombol "Unduh Bukti Pesanan" di bawah.
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-600">Memuat detail pesanan...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <>
            {/* Wrap order details in ref for screenshot */}
            <div ref={orderDetailsRef}>
              {/* Store branding for screenshot */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-pink-500">{storeName}</h2>
                <p className="text-xs text-gray-500">Bukti Pesanan</p>
              </div>

              <section className="bg-white rounded-xl shadow p-6 border border-pink-50 mb-6">
              <h2 className="font-semibold mb-4">Detail Pesanan</h2>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <div className="text-xs text-gray-500">ID Pesanan</div>
                  <div className="font-medium">{order?.order_number || order?.id || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Tanggal Order</div>
                  <div className="font-medium">{order?.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
                </div>

                <div className="col-span-2 border-t pt-4">
                  <div className="text-xs text-gray-500">Nama Pembeli</div>
                  <div className="font-medium">{order?.customer_name || '-'}</div>
                </div>

                <div className="col-span-2 mt-3">
                  <div className="text-xs text-gray-500">Buket yang Dipesan</div>
                  <div className="font-semibold">{order?.bouquet?.name || order?.bouquet_name || '-'}</div>
                </div>

                <div className="col-span-2 mt-3">
                  <div className="text-xs text-gray-500">Jumlah Pesanan</div>
                  <div className="font-medium">{order?.quantity || 1} buket</div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-gray-500">Tanggal Ambil</div>
                  <div className="font-medium">{order?.pickup_date ? new Date(order.pickup_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-500">Jam Ambil</div>
                  <div className="font-medium">{order?.pickup_time || '-'}</div>
                </div>

                <div className="col-span-2 mt-3">
                  <div className="text-xs text-gray-500">Pesan Kartu Ucapan</div>
                  <div className="italic text-gray-600">{order?.card_message || '-'}</div>
                </div>
              </div>

              <div className="mt-4 bg-pink-50 border-t border-pink-100 rounded-b-md p-4">
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <span>Harga Buket:</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                {surcharge > 0 && (
                  <div className="flex justify-between text-xs text-orange-600 mb-1">
                    <span>Biaya Admin ShopeePay:</span>
                    <span className="font-medium">+ {formatPrice(surcharge)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-900 font-bold mb-2 pt-1 border-t border-pink-200">
                  <span>Total:</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 mb-1">
                  <span>Dibayar {order?.payment_type === 'DP' ? '(DP 30%)' : '(Lunas)'}:</span>
                  <span className="font-semibold">{formatPrice(paid)}</span>
                </div>
                {order?.payment_type === 'DP' && remaining > 0 && (
                  <div className="flex justify-between text-sm text-rose-500">
                    <span>Sisa:</span>
                    <span className="font-semibold">{formatPrice(remaining)}</span>
                  </div>
                )}
                {order?.payment_type === 'FULL' && (
                  <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                    ✓ Pembayaran penuh
                  </div>
                )}
                {order?.payment_type === 'DP' && (
                  <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                    ⓘ Sisa dibayar saat pengambilan
                  </div>
                )}
              </div>
            </section>

            {/* WhatsApp Message Preview */}
            {whatsappMessage && (
              <section className="bg-white rounded-xl shadow p-6 border border-pink-50 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.52 3.478A11.916 11.916 0 0012 .5C5.649.5.999 5.149.999 11.5c0 2.026.546 3.91 1.583 5.568L.5 23.5l6.662-1.74A11.937 11.937 0 0012 23.5c6.351 0 11.001-4.649 11.001-11.001 0-3.087-1.205-5.91-2.481-7.021z"/>
                    </svg>
                    Pesan WhatsApp
                  </h3>
                  <button
                    onClick={handleCopyMessage}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Salin Pesan
                      </>
                    )}
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                    {whatsappMessage}
                  </pre>
                </div>
                
                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Anda dapat menyalin pesan ini untuk dikirim manual via WhatsApp
                </p>
              </section>
            )}

            <section className="bg-white rounded-xl shadow p-6 border border-pink-50 mb-6">
              <h3 className="font-semibold mb-3">Langkah Selanjutnya</h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 font-semibold">1</div>
                  <div>Admin akan memeriksa bukti transfer Anda</div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 font-semibold">2</div>
                  <div>Anda akan menerima konfirmasi melalui WhatsApp</div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 font-semibold">3</div>
                  <div>Buket akan diproses sesuai jadwal pengambilan</div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 font-semibold">4</div>
                  <div>Ambil buket sesuai tanggal dan waktu yang dipilih</div>
                </li>
              </ol>
            </section>
            </div>
            {/* End of screenshot area */}

            {/* Download Button - Always visible */}
            <div className="mb-6">
              <button
                onClick={() => handleDownloadProof(false)}
                disabled={isDownloading}
                className="w-full inline-flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors shadow-md"
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengunduh...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Unduh Bukti Pesanan
                  </>
                )}
              </button>
              <div className="mt-3 space-y-1">
                <p className="text-sm text-red-600 font-medium flex items-start gap-1">
                  <span className="flex-shrink-0">*</span>
                  <span>Simpan sebagai barang bukti pesanan Anda</span>
                </p>
                <p className="text-sm text-red-600 font-medium flex items-start gap-1">
                  <span className="flex-shrink-0">*</span>
                  <span>Jika gagal mengunduh, silakan screenshot manual halaman ini (tekan tombol Print Screen atau Screenshot pada perangkat Anda)</span>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              {whatsappUrl ? (
                <a 
                  href={whatsappUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.52 3.478A11.916 11.916 0 0012 .5C5.649.5.999 5.149.999 11.5c0 2.026.546 3.91 1.583 5.568L.5 23.5l6.662-1.74A11.937 11.937 0 0012 23.5c6.351 0 11.001-4.649 11.001-11.001 0-3.087-1.205-5.91-2.481-7.021z"/>
                  </svg>
                  Hubungi via WhatsApp
                </a>
              ) : (
                <div className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-300 text-gray-500 font-semibold py-3 rounded-lg cursor-not-allowed">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.52 3.478A11.916 11.916 0 0012 .5C5.649.5.999 5.149.999 11.5c0 2.026.546 3.91 1.583 5.568L.5 23.5l6.662-1.74A11.937 11.937 0 0012 23.5c6.351 0 11.001-4.649 11.001-11.001 0-3.087-1.205-5.91-2.481-7.021z"/>
                  </svg>
                  WhatsApp Tidak Tersedia
                </div>
              )}

              <Link 
                href="/" 
                className="flex-1 inline-flex items-center justify-center gap-2 border border-pink-300 text-pink-500 hover:bg-pink-50 font-semibold py-3 rounded-lg transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>

            <p className="text-center text-xs text-gray-500 mt-6">♡ Terima kasih telah mempercayai {storeName}</p>
          </>
        )}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
