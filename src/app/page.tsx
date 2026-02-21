'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TempleStatus } from '@prisma/client'

interface Temple {
  id: string
  name: string
  slug: string
  city: string
  address?: string
  telephone?: string
  status: TempleStatus
  dedicationDate?: string
  announcementDate?: string
  groundbreakingDate?: string
  spires?: number
  angelMoroni: boolean
  visitorsCenter: boolean
}

function TempleCard({ temple, isDragging = false }: { temple: Temple; isDragging?: boolean }) {
  const statusColors = {
    [TempleStatus.DEDICATED]: 'bg-green-100 text-green-800 border-green-200',
    [TempleStatus.UNDER_CONSTRUCTION]: 'bg-blue-100 text-blue-800 border-blue-200',
    [TempleStatus.ANNOUNCED]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [TempleStatus.RENOVATING]: 'bg-orange-100 text-orange-800 border-orange-200',
    [TempleStatus.CLOSED]: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const statusLabels = {
    [TempleStatus.DEDICATED]: 'Dedicated',
    [TempleStatus.UNDER_CONSTRUCTION]: 'Under Construction',
    [TempleStatus.ANNOUNCED]: 'Announced',
    [TempleStatus.RENOVATING]: 'Renovating',
    [TempleStatus.CLOSED]: 'Closed',
  }

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 transition-all duration-200
        ${isDragging ? 'opacity-50 rotate-2 scale-95' : 'hover:shadow-lg hover:-translate-y-1'}
      `}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900 leading-tight pr-2">
          {temple.name}
        </h3>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {temple.spires && temple.spires > 0 && (
            <div className="flex items-center text-amber-600">
              <span className="text-sm font-medium">{temple.spires}</span>
              <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L6 8h8l-4-6zM10 18l4-6H6l4 6z"/>
              </svg>
            </div>
          )}
          {temple.angelMoroni && (
            <div className="text-yellow-500" title="Angel Moroni">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v4.586l1.707-1.707a1 1 0 011.414 1.414L12 9.414V13a1 1 0 11-2 0V9.414l-2.121-2.121a1 1 0 011.414-1.414L11 7.586V3a1 1 0 011-1z"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm">{temple.city}, Utah</span>
        </div>

        {temple.address && (
          <div className="flex items-start text-gray-600">
            <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <a
              href={`https://maps.apple.com/?q=${encodeURIComponent(temple.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm leading-relaxed text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              title="Open in Maps"
            >
              {temple.address}
            </a>
          </div>
        )}

        {temple.telephone && (
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <a
              href={`tel:${temple.telephone}`}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              title="Call temple"
            >
              {temple.telephone}
            </a>
          </div>
        )}

        <div className="flex justify-between items-end">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[temple.status]}`}>
              {statusLabels[temple.status]}
            </span>
          </div>

          <div className="text-xs text-gray-500 text-right">
            {temple.dedicationDate && (
              <div>
                {new Date(temple.dedicationDate) > new Date() ? 'Dedication scheduled' : 'Dedicated'} {new Date(temple.dedicationDate).getFullYear()}
              </div>
            )}
            {temple.groundbreakingDate && !temple.dedicationDate && (
              <div>
                {new Date(temple.groundbreakingDate) > new Date() ? 'Groundbreaking scheduled' : 'Groundbreaking'} {new Date(temple.groundbreakingDate).getFullYear()}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            {temple.visitorsCenter && (
              <span className="inline-flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
                Visitors Center
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={`/admin/temples/${temple.id}`}
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
              title="Edit temple information"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </a>
            <div className="text-xs text-gray-400 cursor-move">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 10-4 0v16a2 2 0 104 0V2zM17 2a2 2 0 10-4 0v16a2 2 0 104 0V2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SortableTempleCard({ temple }: { temple: Temple }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: temple.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <TempleCard temple={temple} isDragging={isDragging} />
    </div>
  )
}

export default function HomePage() {
  const [temples, setTemples] = useState<Temple[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  )

  useEffect(() => {
    fetchUtahTemples()
  }, [])

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setTemples((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }

    setActiveId(null)
  }

  const activeTemple = temples.find((temple) => temple.id === activeId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Utah temples...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 text-xl">Error: {error}</div>
            <button
              onClick={fetchUtahTemples}
              className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Utah Temples
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-2">
            Drag and drop to reorder the {temples.length} temples
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Click and drag any temple card to rearrange them in your preferred order
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a
              href="/schedules"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Temple Tours
            </a>
            <a
              href="/admin"
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin Panel
            </a>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={temples.map(t => t.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {temples.map((temple) => (
                <SortableTempleCard key={temple.id} temple={temple} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeTemple ? (
              <TempleCard temple={activeTemple} isDragging />
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>🏛️ Temple data includes dedicated, under construction, and announced temples in Utah</p>
          <p className="mt-2">
            Welcome to Temple Tour - Your comprehensive guide to Utah temples
          </p>
        </div>
      </div>
    </div>
  )
}