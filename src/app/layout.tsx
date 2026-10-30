import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fiscal Register Tool - ERCA Cash Register Engine',
  description: 'High-performance Ethiopian Fiscal Cash Register Processing Engine & Toolbox',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-slate-950 text-slate-100 flex flex-col antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
