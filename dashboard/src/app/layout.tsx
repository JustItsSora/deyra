import type { Metadata, Viewport } from 'next';
import { Manrope, Marcellus } from 'next/font/google';
import Fx from '@/components/Fx';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const marcellus = Marcellus({ subsets: ['latin'], weight: '400', variable: '--font-marcellus', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Deyra — Panel de control del bot', template: '%s · Deyra' },
  description: 'Configura automod, honeypot, anti-nuke, bienvenidas, tickets y registros de tu servidor desde el navegador. Con tu cuenta de Discord.',
};

export const viewport: Viewport = {
  themeColor: '#131a14',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${manrope.variable} ${marcellus.variable}`} data-theme="danica">
      <head>
        {/* Aplica el tema guardado antes del primer paint (sin flash) */}
        <script dangerouslySetInnerHTML={{
          __html: "(function(){try{var t=localStorage.getItem('deyra-theme-v2');if(t)document.documentElement.dataset.theme=t;}catch(e){}})()",
        }} />
      </head>
      <body>
        <Fx />
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
