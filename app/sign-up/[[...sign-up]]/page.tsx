import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <p className="text-5xl mb-3">🌟</p>
        <h1 className="text-2xl font-bold text-gray-900">Habit Tracker</h1>
        <p className="text-sm text-gray-400 mt-1">Daftar gratis, mulai dalam 5 menit</p>
      </div>
      <SignUp />
    </div>
  )
}
