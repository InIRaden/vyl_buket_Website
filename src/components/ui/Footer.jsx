'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [whatsappNumber, setWhatsappNumber] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.data.whatsapp_number) {
          const waData = data.data.whatsapp_number;
          const waNumber = (typeof waData === 'object' && waData?.value) ? waData.value : (typeof waData === 'string' ? waData : null);
          if (waNumber && typeof waNumber === 'string') {
            setWhatsappNumber(waNumber);
          }
        }
      } catch (error) {
        console.error('Failed to fetch WhatsApp number:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Logo & Description */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl text-pink-400">🌸</span>
                </div>
              </div>
              <h3 className="text-xl font-serif font-bold text-pink-400">Vyl bouquet</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
Menciptakan momen spesial dengan rangkaian bunga artificial dan elegan untuk setiap kesempatan
            </p>
          </div>

          {/* Menu */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Menu</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-pink-400 transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="text-gray-600 hover:text-pink-400 transition-colors">
                  Katalog Bucket
                </Link>
              </li>
              <li>
                <Link href="/order" className="text-gray-600 hover:text-pink-400 transition-colors">
                  Pesan Sekarang
                </Link>
              </li>
            </ul>
          </div>

          {/* Jam Operasional */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Jam Operasional</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">Senin - Sabtu</div>
                  <div>08.00 - 18.00 WIB</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-gray-900">Minggu</div>
                  <div>10.00 - 15.00 WIB</div>
                </div>
              </li>
            </ul>
          </div>

          {/* Hubungi Kami */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Hubungi Kami</h4>
            <ul className="space-y-3 text-sm">
              {whatsappNumber && (
                <li>
                  <a 
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-gray-600 hover:text-pink-400 transition-colors"
                  >
                    <svg className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">+{whatsappNumber}</div>
                    </div>
                  </a>
                </li>
              )}
              <li>
                <a 
                  href="mailto:example@gmail.com"
                  className="flex items-start gap-2 text-gray-600 hover:text-pink-400 transition-colors"
                >
                  <svg className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>vylbouquet@gmail.com</div>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>Bandung, Indonesia</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Vyl Bouquet. All rights reserved.</p>
            
          </div>
        </div>
      </div>
    </footer>
  );
}