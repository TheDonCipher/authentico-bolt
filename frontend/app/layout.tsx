import type { Metadata, Viewport } from 'next';
import './globals.css';
import './fonts.css';
import { ThirdwebProvider } from 'thirdweb/react';
import { ReactNode } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import ToastProvider from './components/ui/ToastProvider';
import localFont from 'next/font/local';
import { Inter } from 'next/font/google';
import CsrfInitializer from './components/security/CsrfInitializer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const archivo = localFont({
  src: [
    {
      path: '../public/fonts/Archivo/Archivo-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Archivo/Archivo-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/Archivo/Archivo-Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Authentico',
  description: 'Secure document verification platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <head></head>
      <body className="font-inter">
        <ThirdwebProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <OrganizationProvider>
                  {/* Initialize CSRF protection */}
                  <CsrfInitializer />
                  {children}
                </OrganizationProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
