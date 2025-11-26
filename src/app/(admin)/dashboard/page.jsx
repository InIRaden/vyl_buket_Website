 'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { ClockIcon, CheckCircleIcon, CubeIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    waiting: 0,
    confirmed: 0,
    inProcess: 0,
    ready: 0,
    completed: 0,
    waitingQty: 0,
    confirmedQty: 0,
    inProcessQty: 0,
    readyQty: 0,
    completedQty: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchDashboardData();
    }
  }, [user, loading, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data.stats);
        setRecentOrders(data.data.recentOrders);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      WAITING_CONFIRMATION: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu Konfirmasi' },
      PAYMENT_CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Terkonfirmasi' },
      IN_PROCESS: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Dalam Proses' },
      READY_FOR_PICKUP: { bg: 'bg-green-100', text: 'text-green-800', label: 'Siap Diambil' },
      COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Selesai' },
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return (
      <span className={`px-2.5 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    return status === 'PAID' 
      ? <span className="px-2.5 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Lunas</span>
      : <span className="px-2.5 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Belum Lunas</span>;
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1 text-xs sm:text-sm">Ringkasan aktivitas toko hari ini</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-gray-600 text-[10px] sm:text-xs font-medium leading-tight">Menunggu<br/>Konfirmasi</h3>
            <ClockIcon className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.waiting}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{stats.waitingQty} buket</p>
        </div>
        
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-gray-600 text-[10px] sm:text-xs font-medium leading-tight">Terkonfirmasi</h3>
            <CheckCircleIcon className="w-5 h-5 sm:w-7 sm:h-7 text-blue-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.confirmed}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{stats.confirmedQty} buket</p>
        </div>
        
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-gray-600 text-[10px] sm:text-xs font-medium leading-tight">Sedang<br/>Dibuat</h3>
            <CubeIcon className="w-5 h-5 sm:w-7 sm:h-7 text-purple-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.inProcess}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{stats.inProcessQty} buket</p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-gray-600 text-[10px] sm:text-xs font-medium leading-tight">Siap<br/>Diambil</h3>
            <CubeIcon className="w-5 h-5 sm:w-7 sm:h-7 text-green-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.ready}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{stats.readyQty} buket</p>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className="text-gray-600 text-[10px] sm:text-xs font-medium leading-tight">Selesai</h3>
            <CheckIcon className="w-5 h-5 sm:w-7 sm:h-7 text-gray-500" />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.completed}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{stats.completedQty} buket</p>
        </div>
      </div>
      
      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Pesanan Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm">Belum ada pesanan masuk</p>
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600">Nama Pembeli</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600">Buket</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600">Tanggal Ambil</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600">Status Pesanan</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600">Status Pembayaran</th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {order.customer_name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                      {order.bouquet?.name || '-'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {new Date(order.pickup_date).toLocaleDateString('id-ID', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {getStatusBadge(order.order_status)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {getPaymentBadge(order.payment_status)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                      <Link 
                        href={`/orders/${order.id}`}
                        className="text-primary hover:text-pink-700 font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        Detail
                        <span>→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
