import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

// Initial admin emails - set these users as admins
const INITIAL_ADMIN_EMAILS = [
  'wilsonmatthew@yahoo.com',
  'wilsoncari@yahoo.com',
]

async function setInitialAdmins() {
  console.log('🔧 Setting initial admin users...')

  try {
    let updatedCount = 0

    for (const email of INITIAL_ADMIN_EMAILS) {
      try {
        const result = await prisma.user.updateMany({
          where: { email },
          data: { isAdmin: true }
        })

        if (result.count > 0) {
          console.log(`✅ Set ${email} as admin`)
          updatedCount++
        } else {
          console.log(`⚠️  User not found: ${email}`)
        }
      } catch (error) {
        console.error(`❌ Error updating ${email}:`, error)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   👤 Admin users set: ${updatedCount}`)
    console.log('🎉 Initial admin setup completed!')

  } catch (error) {
    console.error('❌ Error setting initial admins:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setInitialAdmins().catch(console.error)