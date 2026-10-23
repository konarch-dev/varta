'use client';

import React, { useState } from 'react';
import { LeftNav } from './LeftNav';
import { RightSidebar } from './RightSidebar';
import { MobileNav } from './MobileNav';
import { PostComposer } from '../feed/PostComposer';
import { X } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  showRightSidebar = true,
}) => {
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-white dark:bg-[#050B14] flex justify-center text-slate-900 dark:text-slate-100"
      suppressHydrationWarning
    >
      <div className="w-full max-w-7xl flex" suppressHydrationWarning>
        {/* Left Column (Desktop) */}
        <LeftNav onOpenCompose={() => setIsComposeModalOpen(true)} />

        {/* Center Feed Column */}
        <main
          className={`flex-1 min-h-screen border-r border-slate-200 dark:border-[#1E293B] ${
            showRightSidebar ? 'max-w-2xl' : ''
          } min-w-0 pb-20 lg:pb-0`}
        >
          <MobileNav onOpenCompose={() => setIsComposeModalOpen(true)} />
          {children}
        </main>

        {/* Right Column (Desktop) */}
        {showRightSidebar && <RightSidebar />}
      </div>

      {/* Global Compose Modal Dialog */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-3 sm:p-4 pt-4 sm:pt-16 overflow-y-auto">
          <div className="bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto sm:my-0">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-[#1E293B]">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Create Post</span>
              <button
                onClick={() => setIsComposeModalOpen(false)}
                className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-[#101D2D] transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 max-h-[82vh] overflow-y-auto">
              <PostComposer
                onSuccess={() => setIsComposeModalOpen(false)}
                placeholder="What's on your mind? Share with India... #BaatSabki"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
