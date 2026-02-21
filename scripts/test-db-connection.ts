import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('Testing database connection...')

    // Try to connect and get user count
    const userCount = await prisma.user.count()
    console.log('✅ Database connection successful')
    console.log('User count:', userCount)

    // Check if required tables exist
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
    ` as any[]

    console.log('Tables in database:')
    tables.forEach((table: any) => {
      console.log('  -', table.tablename)
    })

  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()