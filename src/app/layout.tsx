import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Plus_Jakarta_Sans, JetBrains_Mono, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});
const hindi = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hindi',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JobTracker AI — Your Career Command Center',
  description: 'Track every job application from wishlist to offer. 12-stage Kanban, analytics, JD + resume matching. Tailor → Apply → Track → Win.',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

// Set theme + lang before hydration to avoid a flash of the wrong theme.
const themeScript = `
(function () {
  try {
    var raw = localStorage.getItem('jobtracker_v3');
    var theme = 'dark', lang = 'en';
    if (raw) {
      var p = JSON.parse(raw);
      if (p && p.userPrefs) { theme = p.userPrefs.theme || 'dark'; lang = p.userPrefs.language || 'en'; }
    }
    var r = document.documentElement;
    r.classList.add(theme);
    r.setAttribute('lang', lang);
  } catch (e) { document.documentElement.classList.add('dark'); }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={`${display.variable} ${sans.variable} ${mono.variable} ${hindi.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="grain min-h-screen">{children}</body>
    </html>
  );
}
