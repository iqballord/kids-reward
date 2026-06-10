export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">🌟 Habit Tracker</h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
