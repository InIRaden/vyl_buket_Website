'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * Komponen Pagination - UI untuk navigasi halaman
 * @param {number} currentPage - Halaman saat ini
 * @param {number} totalPages - Total halaman
 * @param {function} onPageChange - Callback saat halaman berubah
 * @param {number} totalItems - Total item keseluruhan
 * @param {number} startIndex - Index item pertama di halaman ini
 * @param {number} endIndex - Index item terakhir di halaman ini
 * @param {number} perPage - Jumlah item per halaman
 * @param {function} onPerPageChange - Callback saat perPage berubah
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
  startIndex = 1,
  endIndex = 10,
  perPage = 10,
  onPerPageChange,
}) {
  // Generate page numbers dengan ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Maksimal nomor halaman yang ditampilkan

    if (totalPages <= maxVisible) {
      // Jika total halaman sedikit, tampilkan semua
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logika untuk ellipsis
      if (currentPage <= 4) {
        // Awal: 1 2 3 4 5 ... 10
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Akhir: 1 ... 6 7 8 9 10
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        // Tengah: 1 ... 4 5 6 ... 10
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Selalu render pagination untuk debugging, nanti bisa diubah ke totalPages <= 1
  if (totalPages === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-gray-200">
      {/* Info: Showing X to Y of Z entries */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-700">
          Menampilkan <span className="font-medium">{startIndex}</span> - <span className="font-medium">{endIndex}</span> dari{' '}
          <span className="font-medium">{totalItems}</span> data
        </p>

        {/* Items per page selector */}
        {onPerPageChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="perPage" className="text-sm text-gray-600">
              Per halaman:
            </label>
            <select
              id="perPage"
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value={9}>9</option>
              <option value={18}>18</option>
              <option value={27}>27</option>
              <option value={36}>36</option>
              <option value={45}>45</option>
            </select>
          </div>
        )}
      </div>

      {/* Pagination Buttons */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        {/* Page Numbers - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-gray-700">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === page
                    ? 'bg-pink-500 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
                aria-label={`Halaman ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Mobile: Current page indicator */}
        <div className="sm:hidden px-3 py-2 text-sm font-medium text-gray-700">
          {currentPage} / {totalPages}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Halaman selanjutnya"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
