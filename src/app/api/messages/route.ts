import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getCurrentUser, requireAuth } from '../../../lib/session'

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
    const user = await requireAuth()
    const { content, threadId, replyToId } = await request.json()

    if (!content || !content.trim()) {
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

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}