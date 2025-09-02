import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Link from 'next/link'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-soft">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="logo" className="h-8"/>
          </div>
          <nav className="flex gap-3 text-sm">
            <Link className="btn" href="/">Home</Link>
            <Link className="btn" href="/dashboard">Dashboard</Link>
            <Link className="btn" href="/admin">Admin</Link>
            <Link className="btn" href="/login">Login</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        <Component {...pageProps} />
      </main>
    </div>
  )
}
