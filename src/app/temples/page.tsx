'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TempleStatus } from '@prisma/client'

interface TempleSchedule {
  id: string
  scheduledDate: string
  title: string
}

interface Temple {
  id: string
  name: string
  slug: string
  city: string
  state?: string
  address?: string
  status: TempleStatus
  dedicationDate?: string
  schedules?: TempleSchedule[]
}

// Map from DB status to XD design section labels
const statusSectionOrder: { status: TempleStatus[]; label: string }[] = [
  { status: [TempleStatus.DEDICATED], label: 'Operating Temples' },
  { status: [TempleStatus.RENOVATING], label: 'Being Renovated' },
  { status: [TempleStatus.ANNOUNCED, TempleStatus.UNDER_CONSTRUCTION], label: 'Announced' },
]

function LocationPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  )
}

function CheckMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="text-xl font-light text-charcoal tracking-wide whitespace-nowrap">
        {title}
      </h2>
      <div className="flex-1 h-px bg-section-rule" />
    </div>
  )
}

function getVisitStatusText(temple: Temple): { text: string; color: string; href?: string; isCompleted?: boolean } | null {

  // For renovating temples
  if (temple.status === TempleStatus.RENOVATING) {
    return { text: 'Being Renovated', color: 'text-warm-coral' }
  }

  // For under construction/announced
  if (temple.status === TempleStatus.UNDER_CONSTRUCTION || temple.status === TempleStatus.ANNOUNCED) {
    return { text: 'Under Construction', color: 'text-warm-coral' }
  }

  // For dedicated temples, check if there's a scheduled visit
  if (temple.schedules && temple.schedules.length > 0) {
    const schedule = temple.schedules[0]
    const date = new Date(schedule.scheduledDate)
    const now = new Date()
    // For debugging - let's be more explicit about past detection
    const isPastDate = date.getTime() < now.getTime()

    // Use same logic as dashboard to detect month-only appointments
    const isMonthOnly = date.getDate() === 1 &&
                       date.getHours() === 12 &&
                       date.getMinutes() === 0 &&
                       schedule.title.includes('(')
    const href = `/schedules/${schedule.id}?from=temples`

    if (isPastDate && !isMonthOnly) {
      // Past appointment - mark as completed
      const monthDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Denver' })
      return { text: `Visited ${monthDate} at ${time}`, color: 'text-medium-gray', href, isCompleted: true }
    } else if (isMonthOnly) {
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      return { text: `Visit planned for ${monthYear}`, color: 'text-warm-coral', href }
    } else {
      const monthDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
      const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      return { text: `Visit scheduled for ${monthDate} at ${time}`, color: 'text-warm-coral', href }
    }
  }

  return null
}

function getActionButton(temple: Temple): { label: string; href: string } | null {
  // Only show buttons for dedicated/operating temples
  if (temple.status !== TempleStatus.DEDICATED) {
    return null
  }

  // If there's an upcoming scheduled visit
  if (temple.schedules && temple.schedules.length > 0) {
    const schedule = temple.schedules[0]
    const date = new Date(schedule.scheduledDate)
    const isPastDate = date < new Date()
    // Use same logic as dashboard to detect month-only appointments
    const isMonthOnly = date.getDate() === 1 &&
                       date.getHours() === 12 &&
                       date.getMinutes() === 0 &&
                       schedule.title.includes('(')

    // No button for past completed appointments
    if (isPastDate && !isMonthOnly) {
      return null
    }

    if (!isMonthOnly) {
      // Specific date/time appointment
      return { label: 'RSVP', href: `/schedules/${schedule.id}?from=temples` }
    }
    // Penciled in appointment - link to edit page
    return { label: 'Schedule', href: `/schedules/${schedule.id}/edit` }
  }

  // No visit scheduled - show Schedule to create one
  return { label: 'Schedule', href: '/schedules/new' }
}

function TempleCard({ temple }: { temple: Temple }) {
  const visitStatus = getVisitStatusText(temple)
  const action = getActionButton(temple)

  return (
    <div className="py-4 pl-4 pr-2">
      <h3 className="text-base font-bold text-charcoal mb-1.5">{temple.name}</h3>

      <div className="space-y-0.5 text-sm text-medium-gray mb-2">
        <p>{temple.city}, {temple.state || 'Utah'}</p>
        {temple.address && (
          <p className="flex items-start gap-0.5">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(temple.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 hover:text-warm-coral underline cursor-pointer"
            >
              {temple.address}
            </a>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(temple.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-warm-coral cursor-pointer"
              title="Open in maps"
            >
              <LocationPinIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            </a>
          </p>
        )}
        {temple.dedicationDate && (
          <p>Dedicated {new Date(temple.dedicationDate).getFullYear()}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          {visitStatus && (
            visitStatus.href ? (
              <a
                href={visitStatus.href}
                className={`text-sm font-medium ${visitStatus.color} hover:underline cursor-pointer`}
              >
                {visitStatus.text}
              </a>
            ) : (
              <span className={`text-sm font-medium ${visitStatus.color}`}>
                {visitStatus.text}
              </span>
            )
          )}
        </div>
        {action && (
          <a
            href={action.href}
            className="bg-white text-[#B77D63] text-xs font-medium px-4 py-1.5 rounded hover:bg-[#B77D63] hover:text-white transition-colors shadow-sm"
          >
            {action.label}
          </a>
        )}
      </div>
    </div>
  )
}

export default function TemplesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [temples, setTemples] = useState<Temple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    fetchUtahTemples()
  }, [status, router])

  const fetchUtahTemples = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/temples/utah')
      if (!response.ok) {
        throw new Error('Failed to fetch temples')
      }
      const data = await response.json()
      setTemples(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral mx-auto"></div>
        <p className="mt-4 text-medium-gray">Loading temples...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl">Error: {error}</div>
        <button
          onClick={fetchUtahTemples}
          className="mt-4 bg-white text-[#B77D63] px-6 py-2.5 rounded-lg hover:bg-[#B77D63] hover:text-white transition-colors text-sm font-medium shadow-sm"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Group temples by status sections
  const sections = statusSectionOrder.map(({ status: statuses, label }) => ({
    label,
    temples: temples.filter(t => statuses.includes(t.status)),
  })).filter(section => section.temples.length > 0)

  return (
    <div className="pb-8 space-y-8">
      {sections.map((section) => (
        <div key={section.label}>
          <SectionHeader title={section.label} />
          <div className="bg-[#F4F4F4] rounded-xl divide-y divide-light-gray overflow-hidden">
            {section.temples.map((temple) => (
              <TempleCard key={temple.id} temple={temple} />
            ))}
          </div>
        </div>
      ))}

      {sections.length === 0 && (
        <div className="text-center py-12 text-medium-gray">
          No temples found
        </div>
      )}
    </div>
  )
}
