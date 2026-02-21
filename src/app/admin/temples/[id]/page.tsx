'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TempleStatus } from '@prisma/client'

interface Temple {
  id: string
  name: string
  slug: string
  country: string
  state?: string
  city: string
  address?: string
  telephone?: string
  announcementDate?: string
  groundbreakingDate?: string
  dedicationDate?: string
  siteSize?: string
  exteriorFinish?: string
  totalFloorArea?: string
  elevation?: string
  instructionRooms?: number
  sealingRooms?: number
  baptistry: boolean
  spires?: number
  angelMoroni: boolean
  visitorsCenter: boolean
  arrivalCenter: boolean
  patronHousing: boolean
  distributionCenter: boolean
  latitude?: number
  longitude?: number
  status: TempleStatus
}

export default function EditTemplePage() {
  const params = useParams()
  const router = useRouter()
  const [temple, setTemple] = useState<Temple | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTemple()
    }
  }, [params.id])

  const fetchTemple = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/temples/by-id/${params.id}`)
      if (!response.ok) {
        throw new Error('Temple not found')
      }
      const data = await response.json()
      setTemple(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load temple')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!temple) return

    try {
      setSaving(true)
      setError(null)

      const formData = new FormData(e.currentTarget)
      const updateData = {
        name: formData.get('name') as string,
        slug: formData.get('slug') as string,
        country: formData.get('country') as string,
        state: formData.get('state') as string || undefined,
        city: formData.get('city') as string,
        address: formData.get('address') as string || undefined,
        telephone: formData.get('telephone') as string || undefined,
        announcementDate: formData.get('announcementDate') ? new Date(formData.get('announcementDate') as string).toISOString() : undefined,
        groundbreakingDate: formData.get('groundbreakingDate') ? new Date(formData.get('groundbreakingDate') as string).toISOString() : undefined,
        dedicationDate: formData.get('dedicationDate') ? new Date(formData.get('dedicationDate') as string).toISOString() : undefined,
        siteSize: formData.get('siteSize') as string || undefined,
        exteriorFinish: formData.get('exteriorFinish') as string || undefined,
        totalFloorArea: formData.get('totalFloorArea') as string || undefined,
        elevation: formData.get('elevation') as string || undefined,
        instructionRooms: formData.get('instructionRooms') ? parseInt(formData.get('instructionRooms') as string) : undefined,
        sealingRooms: formData.get('sealingRooms') ? parseInt(formData.get('sealingRooms') as string) : undefined,
        baptistry: formData.get('baptistry') === 'on',
        spires: formData.get('spires') ? parseInt(formData.get('spires') as string) : undefined,
        angelMoroni: formData.get('angelMoroni') === 'on',
        visitorsCenter: formData.get('visitorsCenter') === 'on',
        arrivalCenter: formData.get('arrivalCenter') === 'on',
        patronHousing: formData.get('patronHousing') === 'on',
        distributionCenter: formData.get('distributionCenter') === 'on',
        latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : undefined,
        longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : undefined,
        status: formData.get('status') as TempleStatus,
      }

      const response = await fetch(`/api/temples/by-id/${temple.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update temple')
      }

      const updatedTemple = await response.json()
      setTemple(updatedTemple)
      setSuccess(true)

      // Redirect to admin dashboard after successful save
      setTimeout(() => {
        router.push('/admin')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update temple')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!temple) return

    try {
      setDeleting(true)
      setError(null)

      const response = await fetch(`/api/temples/by-id/${temple.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete temple')
      }

      // Redirect to admin dashboard after successful deletion
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete temple')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading temple...</p>
      </div>
    )
  }

  if (error && !temple) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl">Error: {error}</div>
        <Link
          href="/admin"
          className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    )
  }

  if (!temple) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-flex items-center"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Temple</h1>
          <p className="mt-2 text-gray-600">{temple.name}</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-800">✅ Temple updated successfully!</div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">❌ {error}</div>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="admin-form space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Temple Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={temple.name}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                defaultValue={temple.slug}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                defaultValue={temple.city}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State/Province
              </label>
              <input
                type="text"
                id="state"
                name="state"
                defaultValue={temple.state || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                id="country"
                name="country"
                defaultValue={temple.country}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                name="status"
                defaultValue={temple.status}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={TempleStatus.ANNOUNCED}>Announced</option>
                <option value={TempleStatus.UNDER_CONSTRUCTION}>Under Construction</option>
                <option value={TempleStatus.DEDICATED}>Dedicated</option>
                <option value={TempleStatus.RENOVATING}>Renovating</option>
                <option value={TempleStatus.CLOSED}>Closed</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={temple.address || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6">
            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-2">
              Telephone
            </label>
            <input
              type="text"
              id="telephone"
              name="telephone"
              defaultValue={temple.telephone || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Important Dates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Important Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="announcementDate" className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Date
              </label>
              <input
                type="date"
                id="announcementDate"
                name="announcementDate"
                defaultValue={formatDateForInput(temple.announcementDate)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="groundbreakingDate" className="block text-sm font-medium text-gray-700 mb-2">
                Groundbreaking Date
              </label>
              <input
                type="date"
                id="groundbreakingDate"
                name="groundbreakingDate"
                defaultValue={formatDateForInput(temple.groundbreakingDate)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="dedicationDate" className="block text-sm font-medium text-gray-700 mb-2">
                Dedication Date
              </label>
              <input
                type="date"
                id="dedicationDate"
                name="dedicationDate"
                defaultValue={formatDateForInput(temple.dedicationDate)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Physical Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Physical Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="siteSize" className="block text-sm font-medium text-gray-700 mb-2">
                Site Size
              </label>
              <input
                type="text"
                id="siteSize"
                name="siteSize"
                defaultValue={temple.siteSize || ''}
                placeholder="e.g., 15.6 acres"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="totalFloorArea" className="block text-sm font-medium text-gray-700 mb-2">
                Total Floor Area
              </label>
              <input
                type="text"
                id="totalFloorArea"
                name="totalFloorArea"
                defaultValue={temple.totalFloorArea || ''}
                placeholder="e.g., 87,000 sq ft"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="exteriorFinish" className="block text-sm font-medium text-gray-700 mb-2">
                Exterior Finish
              </label>
              <input
                type="text"
                id="exteriorFinish"
                name="exteriorFinish"
                defaultValue={temple.exteriorFinish || ''}
                placeholder="e.g., Natural stone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="elevation" className="block text-sm font-medium text-gray-700 mb-2">
                Elevation
              </label>
              <input
                type="text"
                id="elevation"
                name="elevation"
                defaultValue={temple.elevation || ''}
                placeholder="e.g., 192 feet (59 meters)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Temple Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Temple Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="instructionRooms" className="block text-sm font-medium text-gray-700 mb-2">
                Instruction Rooms
              </label>
              <input
                type="number"
                id="instructionRooms"
                name="instructionRooms"
                defaultValue={temple.instructionRooms || ''}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="sealingRooms" className="block text-sm font-medium text-gray-700 mb-2">
                Sealing Rooms
              </label>
              <input
                type="number"
                id="sealingRooms"
                name="sealingRooms"
                defaultValue={temple.sealingRooms || ''}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="spires" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Spires
              </label>
              <input
                type="number"
                id="spires"
                name="spires"
                defaultValue={temple.spires || ''}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Boolean Features */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Features & Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'baptistry', label: 'Baptistry', defaultChecked: temple.baptistry },
                { name: 'angelMoroni', label: 'Angel Moroni', defaultChecked: temple.angelMoroni },
                { name: 'visitorsCenter', label: 'Visitors Center', defaultChecked: temple.visitorsCenter },
                { name: 'arrivalCenter', label: 'Arrival Center', defaultChecked: temple.arrivalCenter },
                { name: 'patronHousing', label: 'Patron Housing', defaultChecked: temple.patronHousing },
                { name: 'distributionCenter', label: 'Distribution Center', defaultChecked: temple.distributionCenter },
              ].map(({ name, label, defaultChecked }) => (
                <div key={name} className="flex items-center">
                  <input
                    type="checkbox"
                    id={name}
                    name={name}
                    defaultChecked={defaultChecked}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={name} className="ml-2 block text-sm text-gray-900">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Location Coordinates */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Geographic Coordinates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                id="latitude"
                name="latitude"
                step="any"
                defaultValue={temple.latitude || ''}
                placeholder="e.g., 40.7589"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                step="any"
                defaultValue={temple.longitude || ''}
                placeholder="e.g., -111.8883"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Temple
          </button>

          <div className="flex space-x-4">
            <Link
              href="/admin"
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mt-2 px-7 py-3">
                <h3 className="text-lg font-medium text-gray-900 text-center">Delete Temple</h3>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Are you sure you want to delete <strong>{temple?.name}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center px-4 py-3 space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-sm rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}