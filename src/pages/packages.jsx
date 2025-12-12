'use client';
export const dynamic = 'force-dynamic';
import AdminLayout from '@/components/AdminLayout';
import Packages from '@/components/admin/packages/page';

export default function PackagesPage() {
  return (
    <AdminLayout>
      <Packages />
    </AdminLayout>
  );
}

