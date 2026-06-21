import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { SITE } from '@/lib/constants';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import InstallPrompt from '@/components/InstallPrompt';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: SITE.shortName },
  icons: {
    icon: '/favicon.png',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: 'pt_PT',
    type: 'website',
    images: ['/icons/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#06060a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-dvh bg-ink-950 font-sans antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-grid-fade" />
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:pb-16">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
