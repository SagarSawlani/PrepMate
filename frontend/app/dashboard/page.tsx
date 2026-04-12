'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAppStore } from '@/lib/store';
import { Sidebar } from '@/components/sidebar';
import KnowYourExamPage from '@/components/pages/know-your-exam';
import ExploreCollegePage from '@/components/pages/explore-college';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { currentPage } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentPage === 'know-exam' ? <KnowYourExamPage /> : <ExploreCollegePage />}
      </main>
    </div>
  );
}
