// 'use client';
// export const dynamic = 'force-dynamic';
import AdminLayout from '@/components/AdminLayout';
import AdminDashboard from '@/components/admin/dashboard/page';

export default function AdminHome() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}

