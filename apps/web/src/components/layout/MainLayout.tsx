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
    <div className="min-h-screen bg-[#090B10] flex justify-center">
      <div className="w-full max-w-7xl flex">
        {/* Left Column (Desktop) */}
        <LeftNav onOpenCompose={() => setIsComposeModalOpen(true)} />

        {/* Center Feed Column */}
        <main className="flex-1 min-h-screen border-r border-[#252D3A] max-w-2xl min-w-0 pb-20 lg:pb-0">
          <MobileNav onOpenCompose={() => setIsComposeModalOpen(true)} />
          {children}
        </main>

        {/* Right Column (Desktop) */}
        {showRightSidebar && <RightSidebar />}
      </div>

      {/* Global Compose Modal Dialog */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
          <div className="bg-[#11151D] border border-[#252D3A] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#252D3A]">
              <span className="font-bold text-slate-100 text-sm">Create Baat</span>
              <button
                onClick={() => setIsComposeModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-[#191F2B] transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <PostComposer
                onSuccess={() => setIsComposeModalOpen(false)}
                placeholder="Share your perspective with India... #BaatSabki"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
