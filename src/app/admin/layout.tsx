'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// List of admin user emails - update this with your actual admin emails
const ADMIN_EMAILS = [
  // Add your admin email addresses here
  // Example: 'admin@example.com',
  // You can find your user emails in the database or by logging in and checking the session
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin?callbackUrl=/admin')
      return
    }

    const userEmail = session.user?.email
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      router.push('/')
      return
    }

    setIsAuthorized(true)
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-warm-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral mx-auto"></div>
          <p className="mt-4 text-medium-gray">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-warm-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <p className="text-medium-gray mb-6">You don't have permission to access the admin panel.</p>
          <Link
            href="/"
            className="bg-warm-coral text-white px-6 py-2.5 rounded-lg hover:bg-warm-coral-hover transition-colors text-sm font-medium"
          >
            Return to Home
          </Link>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-warm-gray-light">
      <nav className="bg-white shadow-sm border-b border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2 py-3 sm:py-0 sm:h-16">
            <div className="flex items-center">
              <Link href="/admin" className="flex items-center space-x-3">
                <img
                  src="/salt lake temple.svg"
                  alt="Salt Lake Temple"
                  className="w-8 h-8 text-temple-tan"
                />
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
