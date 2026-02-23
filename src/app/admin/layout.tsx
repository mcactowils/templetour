import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-warm-gray-light">
      <nav className="bg-white shadow-sm border-b border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 py-3 sm:py-0 sm:h-16">
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center space-x-2">
                <div className="text-2xl">🏛️</div>
                <span className="text-xl font-bold text-charcoal">Temple Admin</span>
              </Link>
            </div>

            <div className="flex items-center flex-wrap gap-1 sm:gap-2">
              <Link
                href="/admin"
                className="text-charcoal hover:text-charcoal px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="text-charcoal hover:text-charcoal px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Tours
              </Link>
              <Link
                href="/temples"
                className="text-charcoal hover:text-charcoal px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                View Temples
              </Link>
              <div className="hidden sm:block text-sm text-medium-gray pl-2 border-l border-light-gray">Admin Panel</div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
