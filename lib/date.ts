const TZ = 'Asia/Jakarta'

export function todayWIB(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

export function calcAge(dateOfBirth: string): number {
  const today = new Date()
  const dob = new Date(dateOfBirth + 'T00:00:00')
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--
  return Math.max(0, age)
}
