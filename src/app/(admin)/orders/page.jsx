'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import SearchBar from '@/components/ui/SearchBar';
import FilterSelect from '@/components/ui/FilterSelect';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { usePagination } from '@/hooks/usePagination';
import { XMarkIcon } from '@heroicons/react/24/outline';
// jsPDF and jspdf-autotable are loaded dynamically inside `exportToPDF`
// to avoid build-time resolution errors and SSR issues.

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const showToast = useToast(); // Toast notifications
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickupDateFrom, setPickupDateFrom] = useState('');
  const [pickupDateTo, setPickupDateTo] = useState('');
  const [pickupTimeFrom, setPickupTimeFrom] = useState('');
  const [pickupTimeTo, setPickupTimeTo] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, pickup_nearest, price_asc, price_desc
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Backend pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // JWT Protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // fetch orders with optional filters
  const fetchOrders = useCallback(async () => {
    try {
      if (initialLoading) {
        setLoading(true);
      }
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (pickupDateFrom) params.append('pickup_date_from', pickupDateFrom);
      if (pickupDateTo) params.append('pickup_date_to', pickupDateTo);
      if (pickupTimeFrom) params.append('pickup_time_from', pickupTimeFrom);
      if (pickupTimeTo) params.append('pickup_time_to', pickupTimeTo);
      params.append('sort', sortBy);
      params.append('page', currentPage.toString());
      params.append('limit', perPage.toString());

      const res = await fetch(`/api/orders?${params.toString()}`);
      const json = await res.json();
      setOrders(json.data || []);
      
      if (json.pagination) {
        setTotalItems(json.pagination.total);
        setTotalPages(json.pagination.totalPages);
      }
    } catch (err) {
      console.error('fetchOrders', err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [searchQuery, pickupDateFrom, pickupDateTo, pickupTimeFrom, pickupTimeTo, sortBy, currentPage, perPage, initialLoading]);

  // call when relevant filters change (debounce as needed)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, pickupDateFrom, pickupDateTo, pickupTimeFrom, pickupTimeTo, sortBy, currentPage, perPage, fetchOrders]);

  const getStatusBadge = (status) => {
    const config = {
      WAITING_CONFIRMATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu', fullLabel: 'Menunggu Konfirmasi' },
      PAYMENT_CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Konfirmasi', fullLabel: 'Terkonfirmasi' },
      IN_PROCESS: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Proses', fullLabel: 'Dalam Proses' },
      READY_FOR_PICKUP: { bg: 'bg-green-100', text: 'text-green-800', label: 'Siap', fullLabel: 'Siap Diambil' },
      COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Selesai', fullLabel: 'Selesai' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Batal', fullLabel: 'Dibatalkan' },
    };
    const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, fullLabel: status };
    return (
      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium ${c.bg} ${c.text} whitespace-nowrap`}>
        <span className="sm:hidden">{c.label}</span>
        <span className="hidden sm:inline">{c.fullLabel}</span>
      </span>
    );
  };

  const getPaymentBadge = (status, remaining) => {
    if (status === 'PAID' || remaining <= 0) {
      return (
        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
          Lunas
        </span>
      );
    }
    return (
      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium bg-yellow-100 text-yellow-800 whitespace-nowrap">
        <span className="sm:hidden">Belum</span>
        <span className="hidden sm:inline">Belum Lunas</span>
      </span>
    );
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
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      WAITING_CONFIRMATION: 'Menunggu Konfirmasi',
      PAYMENT_CONFIRMED: 'Terkonfirmasi',
      IN_PROCESS: 'Dalam Proses',
      READY_FOR_PICKUP: 'Siap Diambil',
      COMPLETED: 'Selesai',
      CANCELLED: 'Dibatalkan'
    };
    return labels[status] || status;
  };

  // Export visible orders to PDF (runtime dynamic import to avoid SSR issues)
  const exportToPDF = async () => {
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Laporan Pesanan', 14, 15);
      doc.setFontSize(10);
      const ts = new Date().toLocaleString('id-ID');
      doc.text(`Tanggal Cetak: ${ts}`, 14, 22);

      // Tampilkan info filter yang aktif
      let yPos = 28;
      if (searchQuery || pickupDateFrom || pickupDateTo || pickupTimeFrom || pickupTimeTo) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Filter Aktif:', 14, yPos);
        yPos += 5;
        
        if (searchQuery) {
          doc.text(`- Pencarian: ${searchQuery}`, 14, yPos);
          yPos += 4;
        }
        if (pickupDateFrom || pickupDateTo) {
          const dateText = pickupDateFrom && pickupDateTo 
            ? `${formatDate(pickupDateFrom)} - ${formatDate(pickupDateTo)}`
            : pickupDateFrom 
            ? `Dari ${formatDate(pickupDateFrom)}`
            : `Sampai ${formatDate(pickupDateTo)}`;
          doc.text(`- Tanggal Pengambilan: ${dateText}`, 14, yPos);
          yPos += 4;
        }
        if (pickupTimeFrom || pickupTimeTo) {
          const timeText = pickupTimeFrom && pickupTimeTo 
            ? `${pickupTimeFrom} - ${pickupTimeTo}`
            : pickupTimeFrom 
            ? `Dari ${pickupTimeFrom}`
            : `Sampai ${pickupTimeTo}`;
          doc.text(`- Waktu Pengambilan: ${timeText}`, 14, yPos);
          yPos += 4;
        }
        
        // Sort info
        const sortLabel = sortBy === 'newest' ? 'Pesanan Terbaru' : 
                         sortBy === 'oldest' ? 'Pesanan Terlama' : 
                         sortBy === 'pickup_nearest' ? 'Pengambilan Terdekat' :
                         sortBy === 'price_asc' ? 'Harga Termurah' :
                         sortBy === 'price_desc' ? 'Harga Termahal' : 'Waktu Pengambilan';
        doc.text(`- Urutan: ${sortLabel}`, 14, yPos);
        yPos += 4;
        
        doc.setTextColor(0);
        yPos += 2;
      }

      // Gunakan orders (yang sudah terfilter dan tersort dari backend) bukan orders mentah
      const tableData = (orders || []).map((order) => {
        const total = parseFloat(order.bouquet_price || 0);
        const dp = parseFloat(order.dp_amount || 0);
        const remaining = parseFloat(order.remaining_amount || 0);
        const pickupDateTime = order.pickup_date 
          ? `${formatDate(order.pickup_date)} ${order.pickup_time || '-'}`
          : '-';
        
        return [
          order.order_number || (`#${order.id}`),
          order.customer_name || '',
          order.sender_phone || '',
          order.bouquet?.name || 'Custom',
          `${order.quantity || 1}`,
          formatPrice(total),
          order.payment_type === 'DP' ? 'DP' : 'Lunas',
          order.payment_type === 'DP' ? formatPrice(dp) : '-',
          remaining > 0 ? formatPrice(remaining) : '-',
          getStatusLabel(order.order_status),
          pickupDateTime
        ];
      });

      // Tampilkan total records
      doc.setFontSize(9);
      doc.text(`Total Pesanan: ${orders.length} (halaman ini)`, 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [[
          'No. Order', 'Pembeli', 'WA', 'Buket', 'Jumlah', 'Harga', 'Tipe', 'DP', 'Sisa', 'Status', 'Pengambilan'
        ]],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [236, 72, 153], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 20 },
          2: { cellWidth: 18 },
          3: { cellWidth: 18 },
          4: { cellWidth: 12 },
          5: { cellWidth: 16 },
          6: { cellWidth: 10 },
          7: { cellWidth: 16 },
          8: { cellWidth: 16 },
          9: { cellWidth: 18 },
          10: { cellWidth: 22 }
        },
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }

      const fileName = `laporan-pesanan-${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(fileName);
      showToast.success(`PDF berhasil diunduh: ${orders.length} pesanan (halaman ini)`);
    } catch (err) {
      console.error('exportToPDF error', err);
      showToast.error('Gagal mengekspor PDF. Pastikan dependency "jspdf" dan "jspdf-autotable" terpasang.');
    }
  };

  // Handler untuk reset filter
  const handleResetFilter = () => {
    setPickupDateFrom('');
    setPickupDateTo('');
    setPickupTimeFrom('');
    setPickupTimeTo('');
    setSearchQuery('');
    setSortBy('newest');
    setCurrentPage(1);
    setShowResetModal(false);
    showToast.success('Filter berhasil direset');
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // Reset to page 1
  };

  const startIndex = (currentPage - 1) * perPage + 1;
  const endIndex = Math.min(currentPage * perPage, totalItems);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-full overflow-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manajemen Pesanan</h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm">Kelola semua pesanan buket</p>
          </div>
          <button
            onClick={exportToPDF}
            disabled={orders.length === 0}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap touch-target"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Ekspor PDF
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 sm:mb-6 space-y-3">
        {/* Search Bar & Sort Dropdown */}
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Cari nama pembeli atau ID pesanan..."
            />
          </div>
          
          {/* Sort Dropdown */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Urutkan</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1); // Reset to page 1 on sort change
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="newest">Pesanan Terbaru</option>
              <option value="oldest">Pesanan Terlama</option>
              <option value="pickup_nearest">Pengambilan Terdekat</option>
              <option value="price_asc">Harga Termurah</option>
              <option value="price_desc">Harga Termahal</option>
            </select>
          </div>
        </div>
        
        {/* Filter Row */}
        <div className="flex flex-col gap-3">
          {/* Tanggal Pengambilan */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Pengambilan</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={pickupDateFrom}
                onChange={(e) => setPickupDateFrom(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <span className="text-gray-500 text-sm">—</span>
              <input
                type="date"
                value={pickupDateTo}
                onChange={(e) => setPickupDateTo(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Waktu Pengambilan */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Waktu Pengambilan</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={pickupTimeFrom}
                onChange={(e) => setPickupTimeFrom(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <span className="text-gray-500 text-sm">—</span>
              <input
                type="time"
                value={pickupTimeTo}
                onChange={(e) => setPickupTimeTo(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Reset Filter Button */}
          {(pickupDateFrom || pickupDateTo || pickupTimeFrom || pickupTimeTo || searchQuery) && (
            <button
              onClick={() => setShowResetModal(true)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-target flex items-center justify-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Reset Filter */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Konfirmasi Reset Filter"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Apakah Anda yakin ingin menghapus semua filter yang aktif?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowResetModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleResetFilter}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Ya, Reset Filter
            </button>
          </div>
        </div>
      </Modal>
      
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
        {initialLoading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-4 text-xs sm:text-sm">Memuat pesanan...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-xs sm:text-sm">Tidak ada pesanan ditemukan</p>
          </div>
        ) : (
          <div>
            {/* Scroll hint untuk mobile */}
            <div className="sm:hidden px-4 py-2 bg-blue-50 border-b border-blue-100">
              <p className="text-xs text-blue-700 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                Geser tabel ke kanan untuk melihat semua kolom
              </p>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap w-24">
                          No. Pesanan
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[150px]">
                          Nama Pembeli
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[120px]">
                          Buket
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[80px]">
                          Jumlah
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[110px]">
                          Harga Total
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[140px]">
                          Jenis Pembayaran
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[100px]">
                          Sisa
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[140px]">
                          Waktu Pengambilan
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[150px]">
                          Status Pesanan
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap min-w-[130px]">
                          Status Pembayaran
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {orders.map((order) => {
                        const totalPrice = parseFloat(order.bouquet_price || 0);
                        const remaining = parseFloat(order.remaining_amount || 0);
                        
                        // Format pickup datetime
                        const pickupDate = order.pickup_date ? new Date(order.pickup_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                        const pickupTime = order.pickup_time || '-';

                        return (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-2 sm:px-3 py-3">
                              <div className="text-xs font-semibold text-gray-900 break-words max-w-[100px]">
                                {order.order_number}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-700">{order.bouquet?.name || 'Custom'}</div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{order.quantity || 1}</div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{formatPrice(totalPrice)}</div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">{order.payment_type === 'DP' ? 'DP' : 'Lunas'}</span>
                                <span className="text-gray-500 ml-1">
                                  {order.payment_type === 'DP' && `(${formatPrice(order.dp_amount)})`}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <div className={`text-sm font-semibold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {remaining > 0 ? formatPrice(remaining) : '-'}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              <div className="text-xs text-gray-700">
                                <div className="font-medium">{pickupDate}</div>
                                <div className="text-gray-500">{pickupTime}</div>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              {getStatusBadge(order.order_status)}
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                              {getPaymentBadge(order.payment_status, remaining)}
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm">
                              <Link href={`/orders/${order.id}`} className="text-primary hover:text-pink-600 font-semibold transition-colors inline-flex items-center gap-1">
                                <span>Detail</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Pagination */}
        {!initialLoading && orders.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            perPage={perPage}
            onPerPageChange={handlePerPageChange}
          />
        )}
      </div>
    </div>
  );
}
