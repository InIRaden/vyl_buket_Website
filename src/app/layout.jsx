import './globals.css'
import { Inter } from 'next/font/google'
import ToastProvider from '../components/providers/ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'vylbouquet',
  description: 'Pesan buket cantik untuk momen spesial Anda',
  icons: {
    icon: '/logo-removebg-preview.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* Toast Provider - Notifikasi global */}
        <ToastProvider />
        
        {children}
      </body>
    </html>
  )
}
