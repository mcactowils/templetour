import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET /api/schedules - List temple schedules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templeId = searchParams.get('templeId')
    const upcoming = searchParams.get('upcoming')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    if (templeId) {
      where.templeId = templeId
    }

    if (upcoming === 'true') {
      where.scheduledDate = { gte: new Date() }
    } else if (upcoming === 'false') {
      where.scheduledDate = { lt: new Date() }
    }

    const [schedules, total] = await Promise.all([
      prisma.templeSchedule.findMany({
        where,
        take: limit,
        skip: offset,
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
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              attendees: true,
              comments: true,
            },
          },
        },
      }),
      prisma.templeSchedule.count({ where }),
    ])

    return NextResponse.json({
      schedules,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    )
  }
}

// POST /api/schedules - Create a new temple schedule
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.templeId || !data.scheduledDate || !data.title || !data.createdById) {
      return NextResponse.json(
        { error: 'Temple, scheduled date, title, and creator are required' },
        { status: 400 }
      )
    }

    const schedule = await prisma.templeSchedule.create({
      data: {
        templeId: data.templeId,
        createdById: data.createdById,
        scheduledDate: new Date(data.scheduledDate),
        title: data.title,
        description: data.description || null,
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
        _count: {
          select: {
            attendees: true,
            comments: true,
          },
        },
      },
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    )
  }
}
