import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'VARTA — Baat Sabki',
  description: 'A modern, high-speed microblogging & social networking platform built for Indian creators, professionals, and communities.',
  keywords: ['Varta', 'Baat Sabki', 'Social Network', 'India Microblogging', 'Discourse', 'Communities'],
  authors: [{ name: 'VARTA' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090B10] text-[#F8FAFC] antialiased selection:bg-blue-600 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
