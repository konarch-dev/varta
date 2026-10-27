'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '../../../../components/layout/MainLayout';
import { Loader2 } from 'lucide-react';

export default function CommunityRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const rawId = params?.id;
    if (rawId) {
      router.replace(`/communities?id=${encodeURIComponent(String(rawId))}`);
    } else {
      router.replace('/communities');
    }
  }, [params, router]);

  return (
    <MainLayout>
      <div className="min-h-[500px] py-28 flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-[#FF9933]" />
        <span className="text-sm font-medium text-slate-400">Opening community...</span>
      </div>
    </MainLayout>
  );
}
