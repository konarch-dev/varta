'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Hash, Bell, Mail, Feather } from 'lucide-react';
import { VartaLogo } from '../common/VartaLogo';
import { useAuthStore } from '../../stores/authStore';

interface MobileNavProps {
  onOpenCompose?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenCompose }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/explore', icon: Hash, label: 'Explore' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/messages', icon: Mail, label: 'Messages' },
  ];

  return (
    <>
      {/* Top Mobile Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#090B10]/90 backdrop-blur-md border-b border-[#252D3A] px-4 py-3 flex items-center justify-between">
        <Link href={user ? `/${user.username}` : '/login'}>
          <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold overflow-hidden ring-1 ring-blue-500/30">
            {user?.profile?.avatarUrl ? (
              <img
                src={user.profile.avatarUrl}
                alt={user.username}
                className="h-full w-full object-cover"
              />
            ) : (
              (user?.username || 'V').charAt(0).toUpperCase()
            )}
          </div>
        </Link>

        <VartaLogo size={30} showText={true} showTagline={false} />

        <div className="w-8" /> {/* Spacer */}
      </header>

      {/* Floating Compose Action */}
      <button
        onClick={onOpenCompose}
        aria-label="Compose post"
        className="lg:hidden fixed bottom-20 right-5 z-40 h-14 w-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center active:scale-95 transition"
      >
        <Feather size={24} />
      </button>

      {/* Bottom Mobile Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090B10]/95 backdrop-blur-lg border-t border-[#252D3A] flex items-center justify-around py-3 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 rounded-xl transition flex flex-col items-center gap-1 ${
                isActive ? 'text-blue-400' : 'text-slate-400'
              }`}
            >
              <Icon size={24} className={isActive ? 'stroke-[2.5]' : ''} />
            </Link>
          );
        })}
      </nav>
    </>
  );
};
