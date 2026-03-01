import AdminGuard from '@/components/AdminGuard';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';

// Sidebar and bottom nav render immediately — only the content area waits for auth.
// This eliminates the full-screen blank spinner on every page load.
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 md:ml-60 p-4 md:p-8 pb-28 md:pb-8 min-h-screen">
        <AdminGuard>{children}</AdminGuard>
      </main>
      <MobileBottomNav />
    </div>
  );
}
