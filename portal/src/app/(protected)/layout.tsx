import AdminGuard from '@/components/AdminGuard';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar — desktop only */}
        <Sidebar />
        {/* Main content — full width on mobile, offset on desktop */}
        <main className="flex-1 md:ml-60 p-4 md:p-8 pb-28 md:pb-8 min-h-screen">
          {children}
        </main>
        {/* Bottom nav — mobile only */}
        <MobileBottomNav />
      </div>
    </AdminGuard>
  );
}
