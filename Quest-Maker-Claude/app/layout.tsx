import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quest Maker',
  description: 'Generate and manage quests for Garden of the Self',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
