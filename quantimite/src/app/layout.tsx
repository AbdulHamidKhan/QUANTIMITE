import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Quantimite", template: "%s | Quantimite" },
  description: "An educational platform for school, undergraduate, and study-abroad learners.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-brand-600 text-lg">
              Quantimite
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/school" className="hover:text-brand-600">School</Link>
              <Link href="/undergraduate" className="hover:text-brand-600">Undergraduate</Link>
              <Link href="/abroad" className="hover:text-brand-600">Abroad</Link>
              <Link href="/search" className="hover:text-brand-600">Search</Link>
              <Link href="/login" className="hover:text-brand-600">Login</Link>
              <Link href="/admin" className="px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
        </main>
        <footer className="border-t border-slate-200 text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 py-4">
            © {new Date().getFullYear()} Quantimite. Built for learners.
          </div>
        </footer>
      </body>
    </html>
  );
}