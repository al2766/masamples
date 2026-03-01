import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MA Samples — Admin Portal',
  description: 'Admin portal for MaSamples',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
