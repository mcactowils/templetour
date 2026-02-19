import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../lib/prisma'

// GET /api/temple-tours - List temple tours
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templeId = searchParams.get('templeId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (templeId) {
      where.templeId = templeId
    }

    const tours = await prisma.templeTour.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { visitDate: 'desc' },
      include: {
        temple: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            country: true
          }
        }
      }
    })

    return NextResponse.json(tours)
  } catch (error) {
    console.error('Error fetching temple tours:', error)
    return NextResponse.json(
      { error: 'Failed to fetch temple tours' },
      { status: 500 }
    )
  }
}

// POST /api/temple-tours - Create a new temple tour
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.templeId || !data.visitDate) {
      return NextResponse.json(
        { error: 'Temple ID and visit date are required' },
        { status: 400 }
      )
    }

    const tour = await prisma.templeTour.create({
      data: {
        templeId: data.templeId,
        visitDate: new Date(data.visitDate),
        notes: data.notes,
        rating: data.rating,
        userId: data.userId // For future user system
      },
      include: {
        temple: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            country: true
          }
        }
      }
    })

    return NextResponse.json(tour, { status: 201 })
  } catch (error) {
    console.error('Error creating temple tour:', error)
    return NextResponse.json(
      { error: 'Failed to create temple tour' },
      { status: 500 }
    )
  }
}