import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getCurrentUser, requireAuth } from '../../../lib/session'
// import { createMessageReplyNotification } from '../../../lib/notifications'

// GET /api/messages - List messages and schedule comments for messaging view
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get standalone messages (threaded)
    const standaloneMessages = await prisma.message.findMany({
      where: { replyToId: null }, // Only root messages
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            replies: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 25), // Limit standalone messages
      skip: offset
    })

    // Get schedule threads (appointments with their comments)
    const scheduleThreads = await prisma.templeSchedule.findMany({
      where: {
        comments: {
          some: {} // Only schedules that have comments
        }
      },
      include: {
        temple: {
          select: { id: true, name: true, city: true, state: true }
        },
        createdBy: {
          select: { id: true, name: true }
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(50 - standaloneMessages.length, 25) // Fill remaining space with schedule threads
    })

    return NextResponse.json({
      standaloneMessages,
      scheduleThreads,
      pagination: {
        limit,
        offset,
        hasMore: standaloneMessages.length === Math.min(limit, 25)
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Create a new standalone message
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/messages - Starting request')
    const user = await requireAuth()
    console.log('POST /api/messages - User authenticated:', user.id)

    const body = await request.json()
    console.log('POST /api/messages - Request body:', body)
    const { content, threadId, replyToId } = body

    if (!content || !content.trim()) {
      console.log('POST /api/messages - Missing content')
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        userId: user.id,
        content: content.trim(),
        threadId,
        replyToId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    console.log('POST /api/messages - Message created successfully:', message.id)

    // Notification system temporarily disabled for stability
    // TODO: Re-enable notification system after fixing production issues
    /*
    // Create notification for message reply (non-blocking)
    if (replyToId && user.name) {
      try {
        // Fire and forget - don't block response
        createMessageReplyNotification(
          user.id,
          replyToId,
          message.id,
          user.name
        ).catch(error => {
          console.error('Failed to create message reply notification:', error)
        })
      } catch (error) {
        console.error('Error preparing message reply notification:', error)
      }
    }
    */

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('POST /api/messages - Error creating message:', error)
    console.error('POST /api/messages - Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    // Return more detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create message', details: errorMessage },
      { status: 500 }
    )
  }
}