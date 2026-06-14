import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getFamilyContext } from '@/lib/family'

export default async function RootPage() {
  const { userId } = await auth()

  if (!userId) redirect('/sign-in')

  const family = await getFamilyContext()
  if (!family) redirect('/onboarding')

  redirect('/app')
}
