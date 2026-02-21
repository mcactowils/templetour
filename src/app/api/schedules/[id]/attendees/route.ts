import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { getCurrentUser, requireAuth } from '../../../../../lib/session'

// GET /api/schedules/[id]/attendees - List attendees for a schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const attendees = await prisma.scheduleAttendee.findMany({
      where: { scheduleId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(attendees)
  } catch (error) {
    console.error('Error fetching attendees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendees' },
      { status: 500 }
    )
  }
}

// POST /api/schedules/[id]/attendees - Join a schedule (RSVP)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const attendee = await prisma.scheduleAttendee.create({
      data: {
        scheduleId: id,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(attendee, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'User is already attending this schedule' },
        { status: 409 }
      )
    }
    console.error('Error adding attendee:', error)
    return NextResponse.json(
      { error: 'Failed to join schedule' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedules/[id]/attendees - Leave a schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    await prisma.scheduleAttendee.delete({
      where: {
        scheduleId_userId: {
          scheduleId: id,
          userId: user.id,
        },
      },
    })

    return NextResponse.json({ message: 'Successfully left schedule' })
  } catch (error) {
    console.error('Error removing attendee:', error)
    return NextResponse.json(
      { error: 'Failed to leave schedule' },
      { status: 500 }
    )
  }
}
