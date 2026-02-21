import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getCurrentUser, requireAuth } from '../../../../lib/session'

// GET /api/tours/[id] - Get tour detail with trips, members, comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        trips: {
          orderBy: { scheduledDate: 'asc' },
          include: {
            temple: {
              select: {
                id: true,
                name: true,
                slug: true,
                city: true,
                state: true,
                country: true,
                address: true,
              },
            },
            createdBy: {
              select: { id: true, name: true },
            },
            attendees: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
            comments: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
            _count: {
              select: { attendees: true, comments: true },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { members: true, trips: true, comments: true },
        },
      },
    })

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
    }

    return NextResponse.json(tour)
  } catch (error) {
    console.error('Error fetching tour:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tour' },
      { status: 500 }
    )
  }
}

// PUT /api/tours/[id] - Update a tour
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const data = await request.json()

    const tour = await prisma.tour.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description || null,
        }),
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

    return NextResponse.json(tour)
  } catch (error) {
    console.error('Error updating tour:', error)
    return NextResponse.json(
      { error: 'Failed to update tour' },
      { status: 500 }
    )
  }
}

// DELETE /api/tours/[id] - Delete a tour and all its trips
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    await prisma.tour.delete({ where: { id } })

    return NextResponse.json({ message: 'Tour deleted successfully' })
  } catch (error) {
    console.error('Error deleting tour:', error)
    return NextResponse.json(
      { error: 'Failed to delete tour' },
      { status: 500 }
    )
  }
}
