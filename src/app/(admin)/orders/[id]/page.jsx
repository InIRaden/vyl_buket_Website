'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeftIcon, 
  BanknotesIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { useToast } from '../../../../hooks/useToast';
import { useAuth } from '../../../../hooks/useAuth';

export default function OrderDetailPage({ params }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const showToast = useToast(); // Toast notifications
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // JWT Protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchOrderDetail();
  }, []);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setOrder(data.data);
      } else {
        showToast.error('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Gagal memuat detail pesanan');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    if (!confirm(`Ubah status pesanan menjadi "${getStatusLabel(newStatus)}"?`)) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      if (data.success) {
        showToast.success('Status berhasil diupdate!');
        fetchOrderDetail();
      } else {
        showToast.error('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Gagal update status');
    } finally {
      setUpdating(false);
    }
  };

  const markAsFullyPaid = async () => {
    if (!confirm('Tandai pembayaran sudah lunas?')) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'PAID' })
      });
      
      const data = await response.json();
      if (data.success) {
        showToast.success('Pembayaran ditandai lunas!');
        fetchOrderDetail();
      } else {
        showToast.error('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Gagal update pembayaran');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      WAITING_CONFIRMATION: 'Menunggu Konfirmasi',
      PAYMENT_CONFIRMED: 'Pembayaran Terkonfirmasi',
      IN_PROCESS: 'Dalam Proses Pembuatan',
      READY_FOR_PICKUP: 'Siap Diambil',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan'
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status) => {
    const config = {
      WAITING_CONFIRMATION: 'bg-yellow-100 text-yellow-800',
      PAYMENT_CONFIRMED: 'bg-blue-100 text-blue-800',
      IN_PROCESS: 'bg-purple-100 text-purple-800',
      READY_FOR_PICKUP: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return config[status] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Pesanan tidak ditemukan</p>
        <Link href="/orders" className="text-primary mt-4 inline-block">← Kembali ke Daftar Pesanan</Link>
      </div>
    );
  }

  const totalPrice = parseFloat(order.bouquet_price || 0);
  const totalPaid = parseFloat(order.total_paid || 0);
  const dpAmount = parseFloat(order.dp_amount || 0);
  const remaining = parseFloat(order.remaining_amount || 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <Link href="/orders" className="text-primary hover:text-pink-700 flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base touch-target">
          <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Kembali ke Daftar Pesanan</span>
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detail Pesanan {order.order_number}</h1>
            <p className="text-gray-600 mt-1">
              Dibuat pada {formatDate(order.created_at)}
            </p>
          </div>
          <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap ${getStatusBadge(order.order_status)}`}>
            {getStatusLabel(order.order_status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">Informasi Pembeli</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-sm text-gray-500">Nama Pembeli</p>
                <p className="font-semibold">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nama Pengirim / Rekening</p>
                <p className="font-semibold">{order.sender_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Jenis Pembayaran</p>
                <p className="font-semibold">
                  {order.payment_type === 'DP' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      DP (30%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Lunas
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nomor WhatsApp</p>
                <p className="font-semibold">{order.sender_phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">Detail Pesanan</h2>
            <div className="space-y-3 sm:space-y-4">
              {/* Bouquet Info with Image */}
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-2">Buket yang Dipesan</p>
                <div className="flex gap-4">
                  {order.bouquet?.image_url && (
                    <div className="flex-shrink-0">
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2 border-pink-200">
                        <Image
                          src={order.bouquet.image_url}
                          alt={order.bouquet.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-base sm:text-lg">{order.bouquet?.name || 'Custom'}</p>
                    <p className="text-sm text-gray-600 mt-1">Jumlah: <span className="font-semibold text-gray-900">{order.quantity || 1} buket</span></p>
                    <p className="text-primary font-bold text-lg sm:text-xl mt-1">{formatPrice(order.bouquet_price)}</p>
                    {order.bouquet?.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{order.bouquet.description}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tanggal Ambil</p>
                  <p className="font-semibold">{formatDate(order.pickup_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jam Ambil</p>
                  <p className="font-semibold">{order.pickup_time || '-'}</p>
                </div>
              </div>

              {order.card_message && (
                <div>
                  <p className="text-sm text-gray-500">Tulisan Kartu Ucapan</p>
                  <div className="mt-1 p-3 bg-pink-50 border border-pink-200 rounded">
                    <p className="text-gray-700 italic">"{order.card_message}"</p>
                  </div>
                </div>
              )}

              {order.additional_request && (
                <div>
                  <p className="text-sm text-gray-500">Request Tambahan</p>
                  <p className="text-gray-700 mt-1">{order.additional_request}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">Informasi Pembayaran</h2>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
              <div className="flex justify-between">
                <span className="text-gray-600">Jenis Pembayaran</span>
                <span className="font-semibold">{order.payment_type === 'DP' ? 'DP (Down Payment)' : 'Lunas'}</span>
              </div>
              {order.payment_method && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Metode Pembayaran</span>
                  <span className="font-semibold">{order.payment_method}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Harga Total</span>
                <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
              </div>
              {order.payment_type === 'DP' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nominal DP (30%)</span>
                    <span className="font-semibold text-blue-600">{formatPrice(dpAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600 font-semibold">Sisa Pelunasan</span>
                    <span className={`font-bold text-lg ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {remaining > 0 ? formatPrice(remaining) : 'Lunas'}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Total Dibayar</span>
                <span className="font-bold text-green-600">{formatPrice(totalPaid)}</span>
              </div>
            </div>
          </div>

          {/* Images Section */}
          {order.images && order.images.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4">Gambar Pesanan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Foto Referensi */}
                {order.images.filter(img => img.image_type === 'REFERENCE').map((img, idx) => (
                  <div key={img.id}>
                    <p className="text-sm text-gray-500 mb-2">Foto Referensi {idx + 1}</p>
                    <div className="relative h-48 bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-90 border border-gray-200">
                      <Image 
                        src={img.image_url} 
                        alt={`Referensi ${idx + 1}`}
                        fill
                        className="object-cover"
                        onClick={() => window.open(img.image_url, '_blank')}
                      />
                    </div>
                  </div>
                ))}
                
                {/* Bukti Transfer */}
                {order.images.filter(img => img.image_type === 'PAYMENT_PROOF').map((img, idx) => (
                  <div key={img.id}>
                    <p className="text-sm text-gray-500 mb-2">Bukti Transfer {idx + 1}</p>
                    <div className="relative h-48 bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-90 border border-green-200">
                      <Image 
                        src={img.image_url} 
                        alt={`Bukti Transfer ${idx + 1}`}
                        fill
                        className="object-cover"
                        onClick={() => window.open(img.image_url, '_blank')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Aksi</h2>
            <div className="space-y-2 sm:space-y-3">
              {order.order_status === 'WAITING_CONFIRMATION' && (
                <button
                  onClick={() => updateOrderStatus('PAYMENT_CONFIRMED')}
                  disabled={updating}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-sm sm:text-base font-medium touch-target transition-colors"
                >
                  ✓ Konfirmasi Pembayaran
                </button>
              )}
              
              {order.order_status === 'PAYMENT_CONFIRMED' && (
                <button
                  onClick={() => updateOrderStatus('IN_PROCESS')}
                  disabled={updating}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-sm sm:text-base font-medium touch-target transition-colors"
                >
                  🛠️ Tandai Dalam Proses
                </button>
              )}
              
              {order.order_status === 'IN_PROCESS' && (
                <button
                  onClick={() => updateOrderStatus('READY_FOR_PICKUP')}
                  disabled={updating}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 text-sm sm:text-base font-medium touch-target transition-colors"
                >
                  ✓ Tandai Siap Diambil
                </button>
              )}
              
              {order.order_status === 'READY_FOR_PICKUP' && (
                <button
                  onClick={() => updateOrderStatus('COMPLETED')}
                  disabled={updating}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 disabled:opacity-50 text-sm sm:text-base font-medium touch-target transition-colors"
                >
                  ✓ Tandai Selesai
                </button>
              )}
              
              {remaining > 0 && order.order_status !== 'CANCELLED' && (
                <button
                  onClick={markAsFullyPaid}
                  disabled={updating}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 text-sm sm:text-base font-medium touch-target transition-colors flex items-center justify-center gap-2"
                >
                  <BanknotesIcon className="w-5 h-5" />
                  Tandai Pelunasan Dibayar
                </button>
              )}
              
              {order.order_status !== 'COMPLETED' && order.order_status !== 'CANCELLED' && (
                <button
                  onClick={() => updateOrderStatus('CANCELLED')}
                  disabled={updating}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-sm sm:text-base font-medium touch-target transition-colors flex items-center justify-center gap-2"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Batalkan Pesanan
                </button>
              )}
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Status History</h2>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="font-medium">Pesanan Dibuat</p>
                  <p className="text-gray-500 text-xs">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                </div>
              </div>
              {order.updated_at && order.updated_at !== order.created_at && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                  <div>
                    <p className="font-medium">Terakhir Diupdate</p>
                    <p className="text-gray-500 text-xs">{new Date(order.updated_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
