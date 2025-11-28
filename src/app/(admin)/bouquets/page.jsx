'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import BouquetModal from '../../../components/admin/BouquetModal';
import SearchBar from '../../../components/ui/SearchBar';
import FilterSelect from '../../../components/ui/FilterSelect';
import StatsCard from '../../../components/ui/StatsCard';
import Pagination from '../../../components/ui/Pagination';
import { useToast } from '../../../hooks/useToast';
import { usePagination } from '../../../hooks/usePagination';
import { useAuth } from '../../../hooks/useAuth';

export default function BouquetsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const showToast = useToast(); // Toast notifications
  const [bouquets, setBouquets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedBouquet, setSelectedBouquet] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterValue, setFilterValue] = useState("all"); // Combined filter: all, active, inactive, newest, oldest, price_asc, price_desc
  
  // Pagination state (backend pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(9);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to page 1 on search
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // JWT Protection
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/bouquets/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  // Fetch bouquets
  const fetchBouquets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch.trim() !== "") params.set("q", debouncedSearch.trim());
      
      // Handle combined filter
      if (filterValue === "active") {
        params.set("is_active", "true");
      } else if (filterValue === "inactive") {
        params.set("is_active", "false");
      } else if (["newest", "oldest", "price_asc", "price_desc"].includes(filterValue)) {
        params.set("sort", filterValue);
      } else {
        // "all" - no status filter, default sort
        params.set("sort", "newest");
      }
      
      params.set("page", currentPage.toString());
      params.set("limit", perPage.toString());
      
      const query = params.toString();
      const response = await fetch(`/api/bouquets${query ? `?${query}` : ''}`);
      const data = await response.json();

      if (data.success) {
        setBouquets(data.data);
        if (data.pagination) {
          setTotalItems(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Fetch bouquets error:', error);
      showToast.error('Gagal memuat data buket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchBouquets();
  }, [debouncedSearch, filterValue, currentPage, perPage]);

  // Handle tambah buket
  const handleAdd = () => {
    setModalMode('create');
    setSelectedBouquet(null);
    setModalOpen(true);
  };

  // Handle edit buket
  const handleEdit = (bouquet) => {
    setModalMode('edit');
    setSelectedBouquet(bouquet);
    setModalOpen(true);
  };

  // Handle hapus buket
  const handleDelete = async (id, name) => {
    if (!confirm(`Yakin ingin menghapus buket "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/bouquets/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showToast.success('Buket berhasil dihapus');
        fetchStats();
        fetchBouquets();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast.error('Gagal menghapus buket: ' + error.message);
    }
  };

  // Format harga
  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Katalog Buket</h1>
          <p className="text-gray-600 mt-1 text-xs sm:text-sm">Kelola buket yang ditampilkan di website</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-primary hover:bg-pink-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center touch-target"
        >
          <span className="text-base sm:text-lg">+</span>
          <span>Tambah Buket Baru</span>
        </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatsCard
              icon={({ className }) => (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
              label="Total Buket"
              value={stats.total}
              color="blue"
            />
            <StatsCard
              icon={({ className }) => (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              label="Buket Aktif"
              value={stats.active}
              color="green"
            />
            <StatsCard
              icon={({ className }) => (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
              label="Tidak Aktif"
              value={stats.inactive}
              color="red"
            />
            <StatsCard
              icon={({ className }) => (
                <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              label="Rata-rata Harga"
              value={formatPrice(stats.averagePrice)}
              color="purple"
            />
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={(value) => {
              setSearch(value);
              // Debounce akan handle reset page otomatis
            }}
            placeholder="Cari nama atau deskripsi buket..."
          />
          <FilterSelect
            label="Filter"
            value={filterValue}
            onChange={(value) => {
              setFilterValue(value);
              setCurrentPage(1); // Reset to page 1 on filter
            }}
            options={[
              { label: "Semua Status", value: "all" },
              { label: "Aktif", value: "active" },
              { label: "Tidak Aktif", value: "inactive" },
              { label: "Terbaru", value: "newest" },
              { label: "Terlama", value: "oldest" },
              { label: "Termurah", value: "price_asc" },
              { label: "Termahal", value: "price_desc" },
            ]}
            placeholder="Filter"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && bouquets.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Buket</h3>
          <p className="text-gray-500 mb-6">Mulai tambahkan buket untuk ditampilkan di katalog</p>
          <button
            onClick={handleAdd}
            className="bg-primary hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Tambah Buket Pertama
          </button>
        </div>
      )}

      {/* Bouquets Grid */}
      {!loading && bouquets.length > 0 && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {bouquets.map((bouquet) => (
            <div
              key={bouquet.id}
              className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-40 sm:h-48 bg-gray-100">
                {bouquet.image_url ? (
                  <Image
                    src={bouquet.image_url}
                    alt={bouquet.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {/* Status Badge */}
                {!bouquet.is_active && (
                  <div className="absolute top-2 right-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full">
                    Tidak Aktif
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 sm:p-5">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-1">{bouquet.name}</h3>
                <p className="text-lg sm:text-xl font-bold text-primary mb-2 sm:mb-3">{formatPrice(bouquet.price)}</p>
                
                {bouquet.description && (
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                    {bouquet.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-3 sm:mt-4">
                  <button
                    onClick={() => handleEdit(bouquet)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 px-2 sm:px-3 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors font-medium text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 touch-target"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(bouquet.id, bouquet.name)}
                    className="flex-1 bg-red-50 text-red-600 py-2 px-2 sm:px-3 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors font-medium text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-1.5 touch-target"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-6">
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
        </div>
        </>
      )}

      {/* Modal */}
      <BouquetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        bouquet={selectedBouquet}
        onSuccess={() => {
          fetchStats();
          fetchBouquets();
        }}
      />
    </div>
  );
}
