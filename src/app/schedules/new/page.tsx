'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Temple {
  id: string
  name: string
  slug: string
  city: string
  state: string | null
  country: string
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [temples, setTemples] = useState<Temple[]>([])

  // Form state
  const [description, setDescription] = useState('')
  const [templeId, setTempleId] = useState('')
  const [schedulingType, setSchedulingType] = useState<'specific' | 'month'>('specific')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledHour, setScheduledHour] = useState('')
  const [scheduledMinute, setScheduledMinute] = useState('')
  const [scheduledAmPm, setScheduledAmPm] = useState('AM')
  const [scheduledMonth, setScheduledMonth] = useState('')
  const [scheduledYear, setScheduledYear] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    fetchTemples()
    setLoading(false)
  }, [status, router])

  const fetchTemples = async () => {
    try {
      const response = await fetch('/api/temples')
      if (!response.ok) throw new Error('Failed to fetch temples')
      const data = await response.json()
      setTemples(data.temples || [])
    } catch (err) {
      console.error('Error fetching temples:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation based on scheduling type
    if (!templeId || !session?.user) {
      setError('Please fill in all required fields')
      return
    }

    if (schedulingType === 'specific' && (!scheduledDate || !scheduledHour || !scheduledMinute)) {
      setError('Please fill in the date and time for specific scheduling')
      return
    }

    if (schedulingType === 'month' && (!scheduledMonth || !scheduledYear)) {
      setError('Please fill in the month and year for month scheduling')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const selectedTemple = temples.find(t => t.id === templeId)
      if (!selectedTemple) {
        setError('Selected temple not found')
        return
      }

      let scheduledDateTime: Date
      let title: string

      if (schedulingType === 'specific') {
        // Convert 12-hour format to 24-hour format
        let hour24 = parseInt(scheduledHour)
        if (scheduledAmPm === 'PM' && hour24 !== 12) {
          hour24 += 12
        } else if (scheduledAmPm === 'AM' && hour24 === 12) {
          hour24 = 0
        }

        // Create time string in HH:MM format
        const timeString = `${hour24.toString().padStart(2, '0')}:${scheduledMinute.padStart(2, '0')}`
        scheduledDateTime = new Date(`${scheduledDate}T${timeString}`)
        title = selectedTemple.name
      } else {
        // For month scheduling, set to first day of the month at noon
        scheduledDateTime = new Date(parseInt(scheduledYear), parseInt(scheduledMonth) - 1, 1, 12, 0)
        title = `${selectedTemple.name} (${new Date(scheduledDateTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`
      }

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          templeId,
          scheduledDate: scheduledDateTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create appointment')
      }

      router.push('/schedules')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Create Temple Appointment</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium mr-3">
            {session?.user?.name?.[0] || session?.user?.email?.[0] || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">
              Creating appointment as: {session?.user?.name || session?.user?.email}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temple <span className="text-red-500">*</span>
              </label>
              <select
                value={templeId}
                onChange={(e) => setTempleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a temple...</option>
                {temples.map((temple) => (
                  <option key={temple.id} value={temple.id}>
                    {temple.name} - {temple.city}, {temple.state || temple.country}
                  </option>
                ))}
              </select>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduling Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="specific"
                    checked={schedulingType === 'specific'}
                    onChange={(e) => setSchedulingType(e.target.value as 'specific' | 'month')}
                    className="mr-2"
                  />
                  Specific Date & Time
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="month"
                    checked={schedulingType === 'month'}
                    onChange={(e) => setSchedulingType(e.target.value as 'specific' | 'month')}
                    className="mr-2"
                  />
                  Pencil In (Month Only)
                </label>
              </div>
            </div>

            {schedulingType === 'specific' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={schedulingType === 'specific'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={scheduledHour}
                      onChange={(e) => setScheduledHour(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={schedulingType === 'specific'}
                    >
                      <option value="">Hour</option>
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = i + 1
                        return (
                          <option key={hour} value={hour.toString()}>
                            {hour}
                          </option>
                        )
                      })}
                    </select>

                    <select
                      value={scheduledMinute}
                      onChange={(e) => setScheduledMinute(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={schedulingType === 'specific'}
                    >
                      <option value="">Min</option>
                      <option value="00">00</option>
                      <option value="15">15</option>
                      <option value="30">30</option>
                      <option value="45">45</option>
                    </select>

                    <select
                      value={scheduledAmPm}
                      onChange={(e) => setScheduledAmPm(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={schedulingType === 'specific'}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={scheduledMonth}
                    onChange={(e) => setScheduledMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={schedulingType === 'month'}
                  >
                    <option value="">Select month...</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={scheduledYear}
                    onChange={(e) => setScheduledYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={schedulingType === 'month'}
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() + i
                      return (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any details about the appointment - purpose, special instructions, etc..."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/schedules')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Appointment'}
          </button>
        </div>
      </form>
    </div>
  )
}
