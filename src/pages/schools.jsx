'use client';
export const dynamic = 'force-dynamic';
import AdminLayout from '@/components/AdminLayout';
import Schools from '@/components/admin/schools/page';

export default function SchoolsPage() {
  return (
    <AdminLayout>
      <Schools />
    </AdminLayout>
  );
}

