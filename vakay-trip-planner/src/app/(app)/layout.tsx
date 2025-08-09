// src/app/(app)/layout.tsx
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <main className="rounded-xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}