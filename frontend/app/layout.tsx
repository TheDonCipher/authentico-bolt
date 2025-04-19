import type { Metadata } from 'next';
import './globals.css';
import { ThirdwebProvider } from 'thirdweb/react';
import { ReactNode } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { Inter, Archivo } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata = {
  title: 'Authentico',
  description: 'Secure document verification platform',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-inter">
        <ThirdwebProvider>
          <ThemeProvider>
            <AuthProvider>
              <OrganizationProvider>{children}</OrganizationProvider>
            </AuthProvider>
          </ThemeProvider>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
