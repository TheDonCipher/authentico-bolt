import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import { ThirdwebProvider } from "thirdweb/react";
import { ReactNode } from 'react';

export const metadata = {
  title: 'Authentico',
  description: 'Secure document verification platform',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ThirdwebProvider>{children}</ThirdwebProvider>
      </body>
    </html>
  );
}