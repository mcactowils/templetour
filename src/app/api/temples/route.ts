import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/temples - List all temples with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    if (country) {
      where.country = {
        contains: country,
        mode: 'insensitive'
      }
    }

    if (status) {
      where.status = status
    }

    const [temples, total] = await Promise.all([
      prisma.temple.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { tours: true }
          }
        }
      }),
      prisma.temple.count({ where })
    ])

    return NextResponse.json({
      temples,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching temples:', error)
    return NextResponse.json(
      { error: 'Failed to fetch temples' },
      { status: 500 }
    )
  }
}

// POST /api/temples - Create a new temple (admin only in production)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Basic validation
    if (!data.name || !data.country || !data.city) {
      return NextResponse.json(
        { error: 'Name, country, and city are required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const temple = await prisma.temple.create({
      data: {
        ...data,
        slug,
        // Convert date strings to Date objects if provided
        announcementDate: data.announcementDate ? new Date(data.announcementDate) : null,
        groundbreakingDate: data.groundbreakingDate ? new Date(data.groundbreakingDate) : null,
        dedicationDate: data.dedicationDate ? new Date(data.dedicationDate) : null,
      }
    })

    return NextResponse.json(temple, { status: 201 })
  } catch (error) {
    console.error('Error creating temple:', error)
    return NextResponse.json(
      { error: 'Failed to create temple' },
      { status: 500 }
    )
  }
}