import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <p className="text-5xl mb-3">🌟</p>
        <h1 className="text-2xl font-bold text-gray-900">Habit Tracker</h1>
        <p className="text-sm text-gray-400 mt-1">Bangun habit baik bersama anak</p>
      </div>
      <SignIn />
    </div>
  )
}
