import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { families, familyMembers, children, habits } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { calcAge } from '@/lib/date'

function calcAgeFromDob(dob: string) { return calcAge(dob) }

const HABITS_AGE_UNDER_4 = [
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

const HABITS_AGE_4_PLUS = [
  { name: 'Makan pagi habis',        icon: '🍳', schedule: 'morning',   ticketsValue: 2, isMeal: true,  sortOrder: 1 },
  { name: 'Sikat gigi pagi',         icon: '🦷', schedule: 'morning',   ticketsValue: 1, isMeal: false, sortOrder: 2 },
  { name: 'Makan siang habis',       icon: '🍱', schedule: 'afternoon', ticketsValue: 2, isMeal: true,  sortOrder: 3 },
  { name: 'Screen-free / baca buku', icon: '📚', schedule: 'afternoon', ticketsValue: 2, isMeal: false, sortOrder: 4 },
  { name: 'Beresin mainan',          icon: '🧸', schedule: 'afternoon', ticketsValue: 1, isMeal: false, sortOrder: 5 },
  { name: 'Mandi sore',              icon: '🛁', schedule: 'afternoon', ticketsValue: 1, isMeal: false, sortOrder: 6 },
  { name: 'Siapkan tas sekolah',     icon: '🎒', schedule: 'evening',   ticketsValue: 2, isMeal: false, sortOrder: 7 },
  { name: 'Makan malam habis',       icon: '🍽️', schedule: 'evening',   ticketsValue: 2, isMeal: true,  sortOrder: 8 },
  { name: 'Sikat gigi malam',        icon: '🦷', schedule: 'evening',   ticketsValue: 1, isMeal: false, sortOrder: 9 },
  { name: 'Tidur tepat waktu',       icon: '🌙', schedule: 'evening',   ticketsValue: 2, isMeal: false, sortOrder: 10 },
]

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Cek sudah punya keluarga
  const existing = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.clerkUserId, userId))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ error: 'Sudah punya keluarga' }, { status: 409 })
  }

  const body = await request.json()
  const { familyName, childrenData } = body as {
    familyName: string
    childrenData: { name: string; dateOfBirth: string; avatarUrl?: string }[]
  }

  if (!familyName?.trim() || !childrenData?.length) {
    return NextResponse.json({ error: 'familyName dan minimal 1 anak diperlukan' }, { status: 400 })
  }

  // Generate slug unik
  let slug = randomBytes(4).toString('hex')
  const slugExists = await db.select().from(families).where(eq(families.slug, slug))
  if (slugExists.length > 0) slug = randomBytes(4).toString('hex') + Date.now().toString(36)

  // Buat family
  const [family] = await db
    .insert(families)
    .values({ name: familyName.trim(), slug })
    .returning()

  // Buat family member (owner)
  await db.insert(familyMembers).values({
    familyId: family.id,
    clerkUserId: userId,
    role: 'owner',
  })

  // Buat children + preload habits
  for (const child of childrenData) {
    const age = calcAgeFromDob(child.dateOfBirth)
    const [newChild] = await db
      .insert(children)
      .values({
        familyId: family.id,
        name: child.name.trim(),
        dateOfBirth: child.dateOfBirth,
        avatarUrl: child.avatarUrl ?? null,
      })
      .returning()

    const habitTemplate = age < 4 ? HABITS_AGE_UNDER_4 : HABITS_AGE_4_PLUS
    await db.insert(habits).values(habitTemplate.map(h => ({ ...h, childId: newChild.id })))
  }

  return NextResponse.json({ familySlug: family.slug })
}
