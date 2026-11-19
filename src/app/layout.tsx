import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Duo Recomp',
  description: 'Build better habits together. Compete playfully. Grow together.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Duo Recomp', statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }]
  }
};

export const viewport: Viewport = {
  themeColor: '#eef0f6',
  width: 'device-width',
  initialScale: 1,
  // Pinch and double-tap zoom belong in a document, not in an app shell:
  // a stray pinch left the whole interface scaled with no way back.
  maximumScale: 1,
  userScalable: false,
  // Tells the browser the keyboard should shrink the layout, not cover it.
  interactiveWidget: 'resizes-content',
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Loaded by the browser rather than at build time, so the build does not depend on
            reaching Google from the build machine. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
