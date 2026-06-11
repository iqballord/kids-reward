const TZ = 'Asia/Jakarta'

export function todayWIB(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}
