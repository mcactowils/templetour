import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getCurrentUser, requireAuth } from '../../../lib/session'

// GET /api/tours - List all tours
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const [tours, total] = await Promise.all([
      prisma.tour.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              members: true,
              trips: true,
              comments: true,
            },
          },
          trips: {
            orderBy: { scheduledDate: 'asc' },
            take: 1,
            select: { scheduledDate: true },
          },
        },
      }),
      prisma.tour.count(),
    ])

    // Add computed fields
    const toursWithMeta = tours.map((tour) => {
      const nextTrip = tour.trips[0] || null
      const { trips, ...rest } = tour
      return {
        ...rest,
        nextTripDate: nextTrip?.scheduledDate || null,
      }
    })

    return NextResponse.json({
      tours: toursWithMeta,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    })
  } catch (error) {
    console.error('Error fetching tours:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tours' },
      { status: 500 }
    )
  }
}

// POST /api/tours - Create a new tour
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const data = await request.json()

    if (!data.name) {
      return NextResponse.json(
        { error: 'Tour name is required' },
        { status: 400 }
      )
    }

    const tour = await prisma.tour.create({
      data: {
        name: data.name,
        description: data.description || null,
        createdById: user.id,
        // Auto-add creator as ORGANIZER member
        members: {
          create: {
            userId: user.id,
            role: 'ORGANIZER',
          },
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { members: true, trips: true, comments: true },
        },
      },
    })

    return NextResponse.json(tour, { status: 201 })
  } catch (error) {
    console.error('Error creating tour:', error)
    return NextResponse.json(
      { error: 'Failed to create tour' },
      { status: 500 }
    )
  }
}
