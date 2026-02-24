import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/prisma'
import { getCurrentUser } from '../../../../../../lib/session'
import { isAdminEmail } from '../../../../../../lib/admin'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: scheduleId, commentId } = await params

    const comment = await prisma.scheduleComment.findUnique({
      where: { id: commentId },
      include: { user: true }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const isAdmin = isAdminEmail(user.email)
    if (comment.userId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 })
    }

    if (comment.scheduleId !== scheduleId) {
      return NextResponse.json({ error: 'Comment does not belong to this schedule' }, { status: 400 })
    }

    await prisma.scheduleComment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}