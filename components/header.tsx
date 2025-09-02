// components/Header.tsx
import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full border-b bg-white/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-navy">Cortex Hub</Link>

        <nav className="flex items-center gap-2">
          <Link href="/dashboard" className="btn">Dashboard</Link>

          {/* WhatsApp booking link (opens chat with prefilled text) */}
          <a
            href={`https://wa.me/27600000000?text=${encodeURIComponent('hi')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-green-600 hover:bg-green-700"
          >
            Book on WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}
