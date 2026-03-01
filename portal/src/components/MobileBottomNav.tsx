'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FlaskConical,
  ShoppingBag,
  Megaphone,
  Star,
} from 'lucide-react';

const tabs = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/products', icon: FlaskConical, label: 'Products' },
  { href: '/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/banners', icon: Megaphone, label: 'Banners' },
  { href: '/votes', icon: Star, label: 'Votes' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#030213] border-t border-white/10">
      <div className="flex items-stretch pb-safe">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                active ? 'text-amber-400' : 'text-gray-500 active:text-gray-300'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
