import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { TempleStatus } from '@prisma/client'

// Sample temple data based on research
const templeSeedData = [
  {
    name: "Aba Nigeria Temple",
    slug: "aba-nigeria-temple",
    country: "Nigeria",
    state: "Abia State",
    city: "Aba",
    address: "72-80 Okpu-Umuobo Rd, Aba, Abia State, Nigeria",
    telephone: "(+234) 80-3903-4810",
    announcementDate: new Date("2000-04-02"),
    groundbreakingDate: new Date("2002-02-23"),
    dedicationDate: new Date("2005-08-07"),
    siteSize: "6.3 acres (2.5 hectares)",
    exteriorFinish: "Namibian pearl granite",
    totalFloorArea: "11,500 sq ft (1,068 sq meters)",
    elevation: "192 feet (59 meters)",
    instructionRooms: 2,
    sealingRooms: 2,
    baptistry: true,
    spires: 1,
    angelMoroni: true,
    visitorsCenter: false,
    arrivalCenter: false,
    patronHousing: true,
    distributionCenter: true,
    status: TempleStatus.DEDICATED,
  },
  {
    name: "Salt Lake Temple",
    slug: "salt-lake-temple",
    country: "United States",
    state: "Utah",
    city: "Salt Lake City",
    address: "50 W North Temple St, Salt Lake City, UT 84150",
    announcementDate: new Date("1853-02-14"),
    groundbreakingDate: new Date("1853-04-06"),
    dedicationDate: new Date("1893-04-06"),
    siteSize: "10 acres",
    exteriorFinish: "Quartz monzonite granite",
    totalFloorArea: "253,015 sq ft",
    instructionRooms: 10,
    sealingRooms: 15,
    baptistry: true,
    spires: 6,
    angelMoroni: true,
    visitorsCenter: true,
    arrivalCenter: true,
    patronHousing: false,
    distributionCenter: false,
    status: TempleStatus.RENOVATING, // Currently under renovation
  },
  {
    name: "Manila Philippines Temple",
    slug: "manila-philippines-temple",
    country: "Philippines",
    city: "Quezon City",
    announcementDate: new Date("1981-04-04"),
    dedicationDate: new Date("1984-09-25"),
    baptistry: true,
    angelMoroni: true,
    status: TempleStatus.DEDICATED,
  },
  {
    name: "Provo City Center Temple",
    slug: "provo-city-center-temple",
    country: "United States",
    state: "Utah",
    city: "Provo",
    address: "50 S University Ave, Provo, UT 84601",
    announcementDate: new Date("2011-10-01"),
    groundbreakingDate: new Date("2011-05-12"),
    dedicationDate: new Date("2016-03-20"),
    siteSize: "3.4 acres",
    exteriorFinish: "Natural stone and stucco",
    totalFloorArea: "85,084 sq ft",
    instructionRooms: 6,
    sealingRooms: 12,
    baptistry: true,
    spires: 1,
    angelMoroni: true,
    visitorsCenter: true,
    status: TempleStatus.DEDICATED,
  },
  {
    name: "Rome Italy Temple",
    slug: "rome-italy-temple",
    country: "Italy",
    city: "Rome",
    address: "Via di Settebagni 376, 00138 Roma RM, Italy",
    announcementDate: new Date("2008-10-04"),
    groundbreakingDate: new Date("2010-10-23"),
    dedicationDate: new Date("2019-03-10"),
    siteSize: "15 acres",
    exteriorFinish: "Roman travertine stone",
    totalFloorArea: "40,000 sq ft",
    instructionRooms: 6,
    sealingRooms: 12,
    baptistry: true,
    spires: 1,
    angelMoroni: true,
    visitorsCenter: true,
    status: TempleStatus.DEDICATED,
  },
  {
    name: "Nauvoo Illinois Temple",
    slug: "nauvoo-illinois-temple",
    country: "United States",
    state: "Illinois",
    city: "Nauvoo",
    address: "50 N Wells St, Nauvoo, IL 62354",
    announcementDate: new Date("1999-04-04"),
    groundbreakingDate: new Date("1999-10-24"),
    dedicationDate: new Date("2002-06-27"),
    siteSize: "5.5 acres",
    exteriorFinish: "Indiana limestone",
    totalFloorArea: "54,000 sq ft",
    instructionRooms: 4,
    sealingRooms: 5,
    baptistry: true,
    spires: 1,
    angelMoroni: true,
    visitorsCenter: true,
    status: TempleStatus.DEDICATED,
  },
]

async function main() {
  console.log('🌟 Starting temple data seeding...')

  for (const templeData of templeSeedData) {
    try {
      const temple = await prisma.temple.upsert({
        where: { slug: templeData.slug },
        update: templeData,
        create: templeData,
      })
      console.log(`✅ Seeded temple: ${temple.name}`)
    } catch (error) {
      console.error(`❌ Error seeding temple ${templeData.name}:`, error)
    }
  }

  console.log('🎉 Temple seeding completed!')
}

main()
  .catch((e) => {
    console.error('💥 Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })