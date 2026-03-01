'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      if (user.email !== ADMIN_EMAIL) {
        router.replace('/login?error=unauthorized');
        return;
      }
      setStatus('authorized');
    });
    return () => unsubscribe();
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-amber-500" />
          <p className="text-sm text-gray-500">Loading portal…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') return null;

  return <>{children}</>;
}
