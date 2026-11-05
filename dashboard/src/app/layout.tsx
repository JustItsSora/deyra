import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Deyra — Panel de control del bot', template: '%s · Deyra' },
  description: 'Configura automod, honeypot, anti-nuke, bienvenidas, tickets y registros de tu servidor desde el navegador. Con tu cuenta de Discord.',
};

export const viewport: Viewport = {
  themeColor: '#0f1218',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
