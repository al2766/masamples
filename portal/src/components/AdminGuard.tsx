'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

function isAdmin(user: User | null) {
  return !!user && user.email === ADMIN_EMAIL;
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Synchronous check: Firebase restores auth.currentUser from localStorage
  // before the first render on return visits — this lets us skip the loading
  // flash entirely for users who are already logged in.
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>(() => {
    try {
      return isAdmin(auth.currentUser) ? 'authorized' : 'loading';
    } catch {
      return 'loading';
    }
  });

  useEffect(() => {
    if (status === 'authorized') return; // already resolved synchronously

    // Safety net: redirect to login if Firebase doesn't resolve within 8 s
    const timeout = setTimeout(() => router.replace('/login'), 8000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user: User | null) => {
        clearTimeout(timeout);
        if (!isAdmin(user)) { router.replace('/login'); return; }
        setStatus('authorized');
      },
      () => { clearTimeout(timeout); router.replace('/login'); }
    );
    return () => { unsubscribe(); clearTimeout(timeout); };
  }, [router, status]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-amber-500" />
      </div>
    );
  }

  if (status === 'unauthorized') return null;

  return <>{children}</>;
}
