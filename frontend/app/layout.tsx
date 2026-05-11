import type { Metadata } from 'next';
import { Bricolage_Grotesque, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Kraft Market', template: '%s | Kraft Market' },
  description: 'ของดี ของจริง จากคนทำมือทั่วไทย',
  keywords: ['ตลาดออนไลน์', 'ของฝีมือ', 'ไทย', 'kraft market'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${bricolage.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[var(--bg)] text-[var(--ink)] font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
