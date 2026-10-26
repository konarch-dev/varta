'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050B14] text-white p-4">
      <h2 className="text-4xl font-extrabold mb-2 text-[#FF9933]">404</h2>
      <p className="text-slate-400 mb-6">Page Not Found</p>
      <Link
        href="/home"
        className="px-5 py-2.5 rounded-2xl bg-[#FF9933] text-white font-bold hover:bg-[#E68525] transition"
      >
        Return Home
      </Link>
    </div>
  );
}
