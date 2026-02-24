import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getCurrentUser } from '../../../../lib/session'

// PATCH /api/notifications/[id] - Update notification (mark as read/unread)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 })
    }

    const body = await request.json()
    const { isRead } = body

    if (typeof isRead !== 'boolean') {
      return NextResponse.json(
        { error: 'isRead must be a boolean value' },
        { status: 400 }
      )
    }

    console.log(`Updating notification ${id} for user ${user.id}, isRead: ${isRead}`)

    // Verify the notification belongs to the current user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        userId: user.id
      },
      select: { id: true, isRead: true }
    })

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      )
    }

    // Only update if the value is actually changing
    if (existingNotification.isRead === isRead) {
      console.log(`Notification ${id} already has isRead: ${isRead}`)
      return NextResponse.json(existingNotification)
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead },
      select: {
        id: true,
        createdAt: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        actionUrl: true,
        metadata: true
      }
    })

    console.log(`Notification ${id} updated successfully`)

    return NextResponse.json(updatedNotification)

  } catch (error) {
    console.error(`Error updating notification:`, error)
    return NextResponse.json(
      {
        error: 'Failed to update notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/notifications/[id] - Delete notification
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
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 })
    }

    console.log(`Deleting notification ${id} for user ${user.id}`)

    // Verify the notification belongs to the current user and delete in one operation
    const deletedNotification = await prisma.notification.deleteMany({
      where: {
        id,
        userId: user.id
      }
    })

    if (deletedNotification.count === 0) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      )
    }

    console.log(`Notification ${id} deleted successfully`)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(`Error deleting notification:`, error)
    return NextResponse.json(
      {
        error: 'Failed to delete notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}