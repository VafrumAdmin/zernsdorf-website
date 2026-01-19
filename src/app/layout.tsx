import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zernsdorf - Ihr digitales Dorfportal',
  description: 'Das digitale Portal für Zernsdorf',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
