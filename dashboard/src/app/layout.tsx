import type { Metadata, Viewport } from 'next';
import { Manrope, Marcellus } from 'next/font/google';
import Fx from '@/components/Fx';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const marcellus = Marcellus({ subsets: ['latin'], weight: '400', variable: '--font-marcellus', display: 'swap' });

// Tema único oscuro. La clave 'deyra-theme' se mantiene en localStorage:
// los valores antiguos (jade, ámbar, etc.) se normalizan a 'dark' para
// no romper instalaciones que ya tenían el panel abierto.
const themeScript = `try{var t=localStorage.getItem('deyra-theme');if(t!=='dark'){localStorage.setItem('deyra-theme','dark')}}catch(e){}`;

export const metadata: Metadata = {
  title: { default: 'Deyra — Panel de control del bot', template: '%s · Deyra' },
  description: 'Configura automod, honeypot, anti-nuke, bienvenidas, tickets y registros de tu servidor desde el navegador. Con tu cuenta de Discord.',
};

export const viewport: Viewport = {
  themeColor: '#01110a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${manrope.variable} ${marcellus.variable}`} data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Fx />
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
