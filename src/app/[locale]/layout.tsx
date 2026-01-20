import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout';
import { CookieConsent } from '@/components/cookie';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'ZernsdorfConnect - Ihr digitales Dorfportal',
    template: '%s | ZernsdorfConnect',
  },
  description:
    'Das digitale Portal für Zernsdorf - Müllabfuhrtermine, Verkehrsinformationen, Veranstaltungen und Geschichte.',
  keywords: [
    'Zernsdorf',
    'Königs Wusterhausen',
    'Brandenburg',
    'Müllabfuhr',
    'Veranstaltungen',
    'Dorfportal',
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'de' | 'en')) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  // Wartungsmodus-Check wird im (public) Route Group Layout gehandhabt

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 text-slate-900`}
      >
        <NextIntlClientProvider messages={messages}>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
