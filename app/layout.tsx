import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HabboFolio Isometric Room & Admin Console',
  description:
    'An isometric 2D pixel art room inspired by classic Habbo Hotel aesthetics, densely packed with interactive project screens, digital pets, stacked sofas, royal crowns, and a protected /admin control console.',
  openGraph: {
    title: 'HabboFolio Isometric Room & Admin Console',
    description:
      'An isometric 2D pixel art room inspired by classic Habbo Hotel aesthetics, densely packed with interactive project screens, digital pets, stacked sofas, royal crowns, and a protected /admin control console.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HabboFolio Isometric Room & Admin Console',
    description:
      'An isometric 2D pixel art room inspired by classic Habbo Hotel aesthetics, densely packed with interactive project screens, digital pets, stacked sofas, royal crowns, and a protected /admin control console.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="bg-[#050508] text-slate-100 antialiased selection:bg-amber-400 selection:text-slate-950"
        style={{
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
