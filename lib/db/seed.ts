import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL_UNPOOLED!)
const db = drizzle(sql, { schema })

const HABITS_AGE_3 = [
  { name: 'Makan pagi habis',  icon: '🍳', schedule: 'morning',   ticketsValue: 2, isMeal: true,  sortOrder: 1 },
  { name: 'Sikat gigi pagi',   icon: '🦷', schedule: 'morning',   ticketsValue: 1, isMeal: false, sortOrder: 2 },
  { name: 'Tidur siang',       icon: '😴', schedule: 'afternoon', ticketsValue: 2, isMeal: false, sortOrder: 3 },
  { name: 'Makan siang habis', icon: '🍱', schedule: 'afternoon', ticketsValue: 2, isMeal: true,  sortOrder: 4 },
  { name: 'Beresin mainan',    icon: '🧸', schedule: 'afternoon', ticketsValue: 1, isMeal: false, sortOrder: 5 },
  { name: 'Mandi sore',        icon: '🛁', schedule: 'afternoon', ticketsValue: 1, isMeal: false, sortOrder: 6 },
  { name: 'Makan malam habis', icon: '🍽️', schedule: 'evening',   ticketsValue: 2, isMeal: true,  sortOrder: 7 },
  { name: 'Sikat gigi malam',  icon: '🦷', schedule: 'evening',   ticketsValue: 1, isMeal: false, sortOrder: 8 },
  { name: 'Tidur tepat waktu', icon: '🌙', schedule: 'evening',   ticketsValue: 2, isMeal: false, sortOrder: 9 },
]

const HABITS_AGE_6 = [
  { name: 'Makan pagi habis',      icon: '🍳', schedule: 'morning',   ticketsValue: 2, isMeal: true,  sortOrder: 1 },
  { name: 'Sikat gigi pagi',       icon: '🦷', schedule: 'morning',   ticketsValue: 1, isMeal: false, sortOrder: 2 },
  { name: 'Makan siang habis',     icon: '🍱', schedule: 'afternoon', ticketsValue: 2, isMeal: true,  sortOrder: 3 },
  { name: 'Screen-free / baca buku', icon: '📚', schedule: 'afternoon', ticketsValue: 2, isMeal: false, sortOrder: 4 },
  { name: 'Beresin mainan',        icon: '🧸', schedule: 'afternoon', ticketsValue: 1, isMeal: false, sortOrder: 5 },
  { name: 'Mandi sore',            icon: '🛁', schedule: 'afternoon', ticketsValue: 1, isMeal: false, sortOrder: 6 },
  { name: 'Siapkan tas sekolah',   icon: '🎒', schedule: 'evening',   ticketsValue: 2, isMeal: false, sortOrder: 7 },
  { name: 'Makan malam habis',     icon: '🍽️', schedule: 'evening',   ticketsValue: 2, isMeal: true,  sortOrder: 8 },
  { name: 'Sikat gigi malam',      icon: '🦷', schedule: 'evening',   ticketsValue: 1, isMeal: false, sortOrder: 9 },
  { name: 'Tidur tepat waktu',     icon: '🌙', schedule: 'evening',   ticketsValue: 2, isMeal: false, sortOrder: 10 },
]

async function seed() {
  console.log('Seeding children...')

  const existingChildren = await db.select().from(schema.children)
  if (existingChildren.length > 0) {
    console.log('Children already exist, skipping seed.')
    process.exit(0)
  }

  const [child1, child2] = await db
    .insert(schema.children)
    .values([
      { name: 'Anak 1', age: 3 },
      { name: 'Anak 2', age: 6 },
    ])
    .returning()

  console.log(`Created children: ${child1.name} (${child1.id}), ${child2.name} (${child2.id})`)

  console.log('Seeding habits for child 1 (age 3)...')
  await db.insert(schema.habits).values(
    HABITS_AGE_3.map(h => ({ ...h, childId: child1.id }))
  )

  console.log('Seeding habits for child 2 (age 6)...')
  await db.insert(schema.habits).values(
    HABITS_AGE_6.map(h => ({ ...h, childId: child2.id }))
  )

  console.log('Seeding sample rewards...')
  await db.insert(schema.rewards).values([
    { childId: null, name: 'Es krim', ticketCost: 10 },
    { childId: null, name: 'Nonton 1 jam', ticketCost: 15 },
    { childId: null, name: 'Main game 30 menit', ticketCost: 8 },
  ])

  console.log('Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
