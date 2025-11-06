'use client';

import { useAuth } from '../../src/utils/auth_context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardNavbar from '../../components/dashoard/navbar';
import DashboardSidenav from '../../components/dashoard/sidenav';

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/src/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <DashboardSidenav />
      <div className="p-4 md:ml-64 pt-20">
        {children}
      </div>
    </div>
  );
}
