import 'dotenv/config'
import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs/promises'
import { TempleStatus } from '@prisma/client'

interface UtahTemple {
  name: string
  slug: string
  country: string
  state: string
  city: string
  status: TempleStatus
  announcementDate?: Date
  dedicationDate?: Date
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function parseStatus(statusText: string): TempleStatus {
  const status = statusText.toLowerCase()
  if (status.includes('dedicated') || status.includes('operating')) return TempleStatus.DEDICATED
  if (status.includes('construction') || status.includes('building')) return TempleStatus.UNDER_CONSTRUCTION
  if (status.includes('announced')) return TempleStatus.ANNOUNCED
  if (status.includes('renovat') || status.includes('closed')) return TempleStatus.RENOVATING
  return TempleStatus.DEDICATED // Default for most temples
}

async function fetchUtahTemples(): Promise<UtahTemple[]> {
  console.log('🔍 Fetching Utah temples from churchofjesuschrist.org...')

  try {
    const response = await axios.get('https://www.churchofjesuschrist.org/temples/list?lang=eng', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TempleTour/1.0; Educational/Research)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    })

    const $ = cheerio.load(response.data)
    const utahTemples: UtahTemple[] = []

    // Look for temple data in the page
    // The exact selector will depend on how the church website structures this data
    console.log('📄 Analyzing page structure...')

    // Try different possible selectors for temple listings
    const possibleSelectors = [
      '.temple-list-item',
      '.temple-item',
      '[data-temple]',
      '.temple-card',
      'li:contains("Utah")',
      'tr:contains("Utah")',
      '.list-item:contains("Utah")'
    ]

    let templeElements: cheerio.Cheerio<cheerio.Element> = $()

    for (const selector of possibleSelectors) {
      templeElements = $(selector)
      if (templeElements.length > 0) {
        console.log(`✅ Found ${templeElements.length} elements with selector: ${selector}`)
        break
      }
    }

    // If no specific selectors work, look for text containing "Utah"
    if (templeElements.length === 0) {
      console.log('🔍 Searching for Utah references in page content...')

      // Look for any text containing "Utah" and extract temple names
      const pageText = $.text()
      const utahMatches = pageText.match(/([A-Za-z\s]+)\s+Utah/g)

      if (utahMatches) {
        console.log(`📍 Found ${utahMatches.length} potential Utah temple references`)

        utahMatches.forEach((match, index) => {
          const templeName = match.trim()
          if (templeName && !templeName.includes('Temple')) {
            const fullName = `${templeName} Temple`
            utahTemples.push({
              name: fullName,
              slug: createSlug(fullName),
              country: 'United States',
              state: 'Utah',
              city: templeName.replace(' Utah', '').trim(),
              status: TempleStatus.DEDICATED
            })
          }
        })
      }
    }

    return utahTemples

  } catch (error) {
    console.error('❌ Error fetching temple data:', error)

    // Return known Utah temples as fallback
    console.log('📋 Using fallback list of known Utah temples...')
    return [
      {
        name: "Salt Lake Temple",
        slug: "salt-lake-temple",
        country: "United States",
        state: "Utah",
        city: "Salt Lake City",
        status: TempleStatus.RENOVATING,
        announcementDate: new Date("1853-02-14"),
        dedicationDate: new Date("1893-04-06")
      },
      {
        name: "Logan Utah Temple",
        slug: "logan-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Logan",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("1877-05-18"),
        dedicationDate: new Date("1884-05-17")
      },
      {
        name: "Manti Utah Temple",
        slug: "manti-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Manti",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("1877-04-25"),
        dedicationDate: new Date("1888-05-21")
      },
      {
        name: "St. George Utah Temple",
        slug: "st-george-utah-temple",
        country: "United States",
        state: "Utah",
        city: "St. George",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("1871-11-09"),
        dedicationDate: new Date("1877-04-06")
      },
      {
        name: "Ogden Utah Temple",
        slug: "ogden-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Ogden",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("1967-08-26"),
        dedicationDate: new Date("1972-01-18")
      },
      {
        name: "Provo Utah Temple",
        slug: "provo-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Provo",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("1967-08-26"),
        dedicationDate: new Date("1972-02-09")
      },
      {
        name: "Bountiful Utah Temple",
        slug: "bountiful-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Bountiful",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("1992-10-03"),
        dedicationDate: new Date("1995-01-08")
      },
      {
        name: "Mount Timpanogos Utah Temple",
        slug: "mount-timpanogos-utah-temple",
        country: "United States",
        state: "Utah",
        city: "American Fork",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("1992-10-03"),
        dedicationDate: new Date("1996-10-13")
      },
      {
        name: "Vernal Utah Temple",
        slug: "vernal-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Vernal",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("1994-04-02"),
        dedicationDate: new Date("1997-11-02")
      },
      {
        name: "Monticello Utah Temple",
        slug: "monticello-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Monticello",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("1995-04-01"),
        dedicationDate: new Date("1998-07-26")
      },
      {
        name: "Provo City Center Temple",
        slug: "provo-city-center-temple",
        country: "United States",
        state: "Utah",
        city: "Provo",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("2011-10-01"),
        dedicationDate: new Date("2016-03-20")
      },
      {
        name: "Payson Utah Temple",
        slug: "payson-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Payson",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("2008-10-04"),
        dedicationDate: new Date("2015-06-07")
      },
      {
        name: "Cedar City Utah Temple",
        slug: "cedar-city-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Cedar City",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("2017-04-01"),
        dedicationDate: new Date("2017-12-10")
      },
      {
        name: "Saratoga Springs Utah Temple",
        slug: "saratoga-springs-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Saratoga Springs",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("2017-04-01"),
        dedicationDate: new Date("2023-12-17")
      },
      {
        name: "Layton Utah Temple",
        slug: "layton-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Layton",
        status: TempleStatus.DEDICATED,
        announcementDate: new Date("2018-04-07"),
        dedicationDate: new Date("2023-10-15")
      },
      {
        name: "Orem Utah Temple",
        slug: "orem-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Orem",
        status: TempleStatus.UNDER_CONSTRUCTION,
        announcementDate: new Date("2018-04-07")
      },
      {
        name: "Smithfield Utah Temple",
        slug: "smithfield-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Smithfield",
        status: TempleStatus.UNDER_CONSTRUCTION,
        announcementDate: new Date("2021-10-03")
      },
      {
        name: "Syracuse Utah Temple",
        slug: "syracuse-utah-temple",
        country: "United States",
        state: "Utah",
        city: "Syracuse",
        status: TempleStatus.UNDER_CONSTRUCTION,
        announcementDate: new Date("2020-04-05")
      }
    ]
  }
}

async function main() {
  try {
    console.log('🌟 Starting Utah temple data collection...')

    const utahTemples = await fetchUtahTemples()

    console.log(`✅ Found ${utahTemples.length} Utah temples`)

    // Save to JSON file
    await fs.writeFile(
      'scripts/utah-temples.json',
      JSON.stringify(utahTemples, null, 2)
    )

    console.log('💾 Saved Utah temple data to scripts/utah-temples.json')

    // Display the list
    console.log('\n🏛️  Utah Temples:')
    utahTemples.forEach((temple, index) => {
      console.log(`${index + 1}. ${temple.name} - ${temple.city} (${temple.status})`)
    })

    console.log('🎉 Utah temple collection completed!')

  } catch (error) {
    console.error('💥 Error during temple collection:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { fetchUtahTemples, type UtahTemple }