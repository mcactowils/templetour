import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getCurrentUser, isUserAdmin } from '../../../../lib/session'

// DELETE /api/messages/[id] - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: messageId } = await params

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { user: true }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const isAdmin = await isUserAdmin(user)
    if (message.userId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 })
    }

    await prisma.message.delete({
      where: { id: messageId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
}