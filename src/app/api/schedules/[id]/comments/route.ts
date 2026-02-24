import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
// import { createCommentNotification } from '../../../../../lib/notifications'

// GET /api/schedules/[id]/comments - List comments for a schedule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const comments = await prisma.scheduleComment.findMany({
      where: { scheduleId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/schedules/[id]/comments - Add a comment to a schedule
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    if (!data.userId || !data.content) {
      return NextResponse.json(
        { error: 'User ID and content are required' },
        { status: 400 }
      )
    }

    const comment = await prisma.scheduleComment.create({
      data: {
        scheduleId: id,
        userId: data.userId,
        content: data.content,
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

    // Notification system temporarily disabled for stability
    // TODO: Re-enable notification system after fixing production issues
    /*
    // Create notifications for schedule participants (non-blocking)
    try {
      const schedule = await prisma.templeSchedule.findUnique({
        where: { id },
        select: { title: true }
      })

      if (schedule && comment.user.name) {
        // Fire and forget - don't block response
        createCommentNotification(
          data.userId,
          id,
          comment.id,
          comment.user.name,
          schedule.title
        ).catch(error => {
          console.error('Failed to create comment notification:', error)
        })
      }
    } catch (error) {
      console.error('Error preparing comment notification:', error)
    }
    */

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
