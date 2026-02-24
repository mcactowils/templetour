'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface Schedule {
  id: string
  scheduledDate: string
  title: string
  temple: {
    id: string
    name: string
    slug: string
    city: string
    state: string
  }
}

function TempleIconSmall({ className }: { className?: string }) {
  return (
    <img
      src="/salt lake temple.svg"
      alt="Salt Lake Temple"
      className={className}
    />
  )
}
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function CheckMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  )
}

const DAY_LABELS = ['SUN', 'MON', 'TUES', 'WED', 'THURS', 'FRI', 'SAT']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function isMonthOnlyAppointment(date: string, title: string) {
  const appointmentDate = new Date(date)
  return appointmentDate.getDate() === 1 &&
         appointmentDate.getHours() === 12 &&
         appointmentDate.getMinutes() === 0 &&
         title.includes('(')
}

function isPastAppointment(scheduledDate: string) {
  const appointmentDate = new Date(scheduledDate)
  const now = new Date()
  const isPast = appointmentDate.getTime() < now.getTime()


  return isPast
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarPage() {
  const { status } = useSession()
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    fetchSchedules()
  }, [status, router])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/schedules?limit=100')
      if (!response.ok) throw new Error('Failed to fetch schedules')
      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch {
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Build a map of day -> schedules for the current month
  const schedulesByDay = useMemo(() => {
    const map: Record<number, Schedule[]> = {}
    schedules.forEach((schedule) => {
      const date = new Date(schedule.scheduledDate)
      if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
        const day = date.getDate()
        if (!map[day]) map[day] = []
        map[day].push(schedule)
      }
    })
    return map
  }, [schedules, currentYear, currentMonth])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long' }).toUpperCase()

  // Build calendar grid (6 rows max)
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
  const calendarCells: (number | null)[] = []
  for (let i = 0; i < totalCells; i++) {
    const day = i - firstDay + 1
    calendarCells.push(day >= 1 && day <= daysInMonth ? day : null)
  }

  // Group cells into weeks
  const weeks: (number | null)[][] = []
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral mx-auto"></div>
        <p className="mt-4 text-medium-gray">Loading calendar...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Month/Year header with navigation arrows */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-light-gray text-medium-gray hover:text-charcoal hover:border-charcoal transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-wide">
          {monthName} {currentYear}
        </h1>

        <button
          onClick={goToNextMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-light-gray text-medium-gray hover:text-charcoal hover:border-charcoal transition-colors"
          aria-label="Next month"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="border border-light-gray rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-white border-b border-light-gray">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center py-2 text-[10px] sm:text-xs font-semibold text-medium-gray uppercase tracking-wider"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-light-gray last:border-b-0">
            {week.map((day, dayIndex) => {
              const daySchedules = day ? schedulesByDay[day] || [] : []
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear()

              return (
                <div
                  key={dayIndex}
                  className={`min-h-[70px] sm:min-h-[90px] p-1 sm:p-1.5 border-r border-light-gray last:border-r-0 ${
                    day ? 'bg-white' : 'bg-warm-gray-light/50'
                  }`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-xs sm:text-sm font-medium mb-0.5 ${
                          isToday
                            ? 'text-warm-coral font-bold'
                            : 'text-charcoal'
                        }`}
                      >
                        {day}
                      </div>
                      {daySchedules.map((schedule) => {
                        const time = new Date(schedule.scheduledDate)
                        const isMonthOnly = isMonthOnlyAppointment(schedule.scheduledDate, schedule.title)
                        const isPast = isPastAppointment(schedule.scheduledDate) && !isMonthOnly
                        const timeStr = isMonthOnly
                          ? ''
                          : time.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })
                        // Extract short name (e.g. "Taylorsville" from "Taylorsville Utah Temple")
                        const shortName = schedule.temple.name
                          .replace(/ Utah Temple$/i, '')
                          .replace(/ Temple$/i, '')

                        return (
                          <Link
                            key={schedule.id}
                            href={`/schedules/${schedule.id}?from=calendar`}
                            className="block group"
                          >
                            <div className="relative flex flex-col items-center text-center mt-0.5">
                              <div className="relative">
                                <TempleIconSmall className="w-6 h-6 sm:w-7 sm:h-7 text-temple-tan group-hover:text-warm-coral transition-colors drop-shadow-sm" />
                                {isPast && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-600 rounded-full flex items-center justify-center">
                                    <CheckMarkIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[8px] sm:text-[10px] text-charcoal leading-tight mt-0.5 group-hover:text-warm-coral transition-colors">
                                {shortName}
                              </span>
                              {timeStr && (
                                <span className="text-[8px] sm:text-[10px] text-medium-gray leading-tight">
                                  {timeStr}
                                </span>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
