import type { Metadata, Viewport } from 'next';
import Intro from '@/components/Intro';
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
        <script
          // Runs before first paint: decides whether the opening is due and
          // marks the document, so the cover below is painted immediately
          // rather than after hydration. The timeout is a dead-man's switch —
          // if the component never mounts, the app must not stay hidden.
          dangerouslySetInnerHTML={{
            __html:
              "try{var th=localStorage.getItem('theme');var dark=th==='dark'||(!th&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';}catch(e){}try{var s=sessionStorage.getItem('intro:v2');var calm=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!s&&!calm){document.documentElement.dataset.intro='on';setTimeout(function(){document.documentElement.removeAttribute('data-intro')},9000)}}catch(e){}"
          }}
        />
        {/* Loaded by the browser rather than at build time, so the build does not depend on
            reaching Google from the build machine. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Overlays the app rather than gating it: whatever is underneath is
            already rendered and interactive, so the opening never delays
            signing in. */}
        <Intro />
        {children}
      </body>
    </html>
  );
}
