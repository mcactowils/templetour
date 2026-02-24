import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getCurrentUser } from '../../../../lib/session'
import { isAdminEmail } from '../../../../lib/admin'

// GET /api/schedules/[id] - Get a specific schedule with attendees and comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const schedule = await prisma.templeSchedule.findUnique({
      where: { id },
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
          select: {
            id: true,
            name: true,
          },
        },
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            attendees: true,
            comments: true,
          },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

// PUT /api/schedules/[id] - Update a schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const existingSchedule = await prisma.templeSchedule.findUnique({
      where: { id },
      include: { createdBy: true }
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const isAdmin = isAdminEmail(user.email)
    if (existingSchedule.createdById !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'You can only edit appointments you created' }, { status: 403 })
    }

    const schedule = await prisma.templeSchedule.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.scheduledDate && { scheduledDate: new Date(data.scheduledDate) }),
        ...(data.templeId && { templeId: data.templeId }),
      },
      include: {
        temple: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            state: true,
            country: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
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
          select: {
            attendees: true,
            comments: true,
          },
        },
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedules/[id] - Delete a schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const appointment = await prisma.templeSchedule.findUnique({
      where: { id },
      include: { createdBy: true }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const isAdmin = isAdminEmail(user.email)
    if (appointment.createdById !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'You can only delete appointments you created' }, { status: 403 })
    }

    await prisma.templeSchedule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
}
