'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Hash,
  Bell,
  Mail,
  Bookmark,
  User,
  Settings,
  ShieldCheck,
  Feather,
  LogOut,
} from 'lucide-react';
import { VartaLogo } from '../common/VartaLogo';
import { useAuthStore } from '../../stores/authStore';

interface LeftNavProps {
  onOpenCompose?: () => void;
}

export const LeftNav: React.FC<LeftNavProps> = ({ onOpenCompose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navItems = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Explore', href: '/explore', icon: Hash },
    { label: 'Notifications', href: '/notifications', icon: Bell },
    { label: 'Messages', href: '/messages', icon: Mail },
    { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    {
      label: 'Profile',
      href: user ? `/${user.username}` : '/login',
      icon: User,
    },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  if (user?.role === 'ADMIN' || user?.role === 'MODERATOR') {
    navItems.push({ label: 'Admin', href: '/admin', icon: ShieldCheck });
  }

  return (
    <aside className="sticky top-0 h-screen w-20 xl:w-64 flex flex-col justify-between py-4 px-2 xl:px-4 border-r border-[#252D3A] bg-[#090B10]/80 backdrop-blur-md z-30">
      <div className="flex flex-col gap-4">
        {/* Brand Logo */}
        <Link
          href="/home"
          className="flex items-center gap-2 p-2 hover:bg-[#11151D] rounded-full xl:rounded-xl transition w-fit xl:w-full"
        >
          <VartaLogo size={38} showText={true} showTagline={true} />
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-3.5 py-3 rounded-xl font-medium transition text-base ${
                  isActive
                    ? 'text-white bg-blue-600/15 font-semibold text-blue-400'
                    : 'text-slate-300 hover:text-white hover:bg-[#11151D]'
                }`}
              >
                <Icon
                  size={24}
                  className={isActive ? 'text-blue-400 stroke-[2.5]' : 'text-slate-400'}
                />
                <span className="hidden xl:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Compose Button */}
        <button
          onClick={onOpenCompose}
          className="mt-2 w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2 group active:scale-[0.98]"
        >
          <Feather size={20} className="xl:hidden group-hover:rotate-12 transition-transform" />
          <span className="hidden xl:inline">Post Baat</span>
        </button>
      </div>

      {/* User Card & Logout */}
      {user ? (
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#11151D] border border-transparent hover:border-[#252D3A] transition">
          <Link
            href={`/${user.username}`}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 font-bold shrink-0 overflow-hidden ring-1 ring-blue-500/30">
              {user.profile?.avatarUrl ? (
                <img
                  src={user.profile.avatarUrl}
                  alt={user.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden xl:flex flex-col text-left overflow-hidden">
              <span className="font-semibold text-sm text-slate-100 truncate">
                {user.profile?.displayName || user.username}
              </span>
              <span className="text-xs text-slate-400 truncate">
                @{user.username}
              </span>
            </div>
          </Link>

          <button
            onClick={() => logout()}
            title="Log out"
            className="hidden xl:flex text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        <div className="hidden xl:flex flex-col gap-2 p-3 bg-[#11151D] rounded-xl border border-[#252D3A]">
          <span className="text-xs text-slate-400">Join the dialogue</span>
          <Link
            href="/login"
            className="text-center py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition"
          >
            Log in
          </Link>
        </div>
      )}
    </aside>
  );
};
