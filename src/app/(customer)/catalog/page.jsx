'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavBar from '../../../components/ui/NavBar';
import Footer from '../../../components/ui/Footer';
import Pagination from '../../../components/ui/Pagination';

export default function CatalogPage() {
  const [bouquets, setBouquets] = useState([]);
  // Inisialisasi false agar tidak flash loading saat pertama render (opsional, tapi lebih smooth)
  const [loading, setLoading] = useState(true); 
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(9);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(1); 
    }, 500); 

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch bouquets
  useEffect(() => {
    fetchBouquets();
  }, [debouncedQuery, currentPage, perPage]);

  const fetchBouquets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("is_active", "true");
      params.set("page", currentPage.toString());
      params.set("limit", perPage.toString());
      if (debouncedQuery.trim() !== "") params.set("q", debouncedQuery.trim());
      
      const response = await fetch(`/api/bouquets?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setBouquets(data.data);
        if (data.pagination) {
          setTotalItems(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('Error fetching bouquets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerPageChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * perPage + 1;
  const endIndex = Math.min(currentPage * perPage, totalItems);

  // --- BAGIAN YANG DIHAPUS: if (loading) return (...) ---
  // Kita tidak lagi meng-return full page loading di sini.
  // Struktur halaman (Navbar, Search) akan tetap ada.

  return (
    <>
      {/* Navbar Tetap Render */}
      <div className="relative z-20">
        <NavBar />
      </div>

      {/* Main Content */}
      <div className="min-h-screen pt-20 md:pt-24 pb-12 px-3 sm:px-4 md:px-6 font-serif bg-gradient-soft">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-8 md:mb-12 animate-slide-in-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-3">
              Katalog Buket
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Jelajahi koleksi buket bunga kami yang indah dan elegan untuk setiap momen spesial
            </p>
          </div>

          {/* Search Bar - Tetap di tempat, tidak akan hilang saat loading */}
          <div className="max-w-2xl mx-auto mb-8 md:mb-12 px-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 sm:left-4 flex items-center text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM8 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari buket..."
                className="w-full border border-gray-300 rounded-full py-3 sm:py-4 pl-10 sm:pl-14 pr-4 sm:pr-6 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all text-sm sm:text-base touch-target"
              />
            </div>
          </div>

          {/* Catalog Grid Area - Loading ditangani di sini */}
          {loading ? (
             // TAMPILAN SAAT LOADING (Hanya mengganti area grid)
             <div className="min-h-[400px] flex flex-col items-center justify-center text-gray-500">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                <p>Mencari bunga cantik...</p>
             </div>
          ) : bouquets.length === 0 ? (
            // TAMPILAN JIKA KOSONG
            <div className="text-center text-gray-600 py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-lg">Belum ada buket tersedia</p>
            </div>
          ) : (
            // TAMPILAN DATA (GRID)
            <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {bouquets.map((bouquet) => (
                <div 
                  key={bouquet.id} 
                  className="bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-shadow flex flex-col group"
                >
                  <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 bg-gray-100 overflow-hidden rounded-t-lg sm:rounded-t-xl">
                    {bouquet.image_url ? (
                      <Image
                        src={bouquet.image_url}
                        alt={bouquet.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-serif font-bold mb-1 sm:mb-2 line-clamp-2 text-gray-900">
                        {bouquet.name}
                      </h3>
                      <p className="hidden sm:block text-xs md:text-sm text-gray-600 mb-3 line-clamp-2">
                        {bouquet.description || 'Mixed seasonal flowers in warm tones'}
                      </p>
                    </div>

                    <div className="mt-2 sm:mt-3">
                      <div className="mb-2 sm:mb-3">
                        <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-pink-400 block">
                          {formatPrice(bouquet.price)}
                        </span>
                      </div>
                      <Link
                        href={`/order?bouquet_id=${bouquet.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-pink-400 hover:bg-pink-500 active:bg-pink-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all hover:shadow-md text-xs sm:text-sm md:text-base touch-target"
                      >
                        <span className="hidden sm:inline">Pilih buket ini</span>
                        <span className="sm:hidden">Pilih</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination hanya muncul jika tidak loading & ada data */}
            <div className="mt-8 md:mt-12">
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

            <div className="text-center mt-6 text-sm text-gray-500">
              Menampilkan {startIndex}-{endIndex} dari {totalItems} buket
              {debouncedQuery && ` untuk "${debouncedQuery}"`}
            </div>
            </>
          )}
        </div>
      </div>
      
      <Footer />
    </>
  );
}