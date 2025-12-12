'use client';
export const dynamic = 'force-dynamic';
import AdminLayout from '@/components/AdminLayout';
import Organizations from '@/components/admin/organizations/page';

export default function OrganizationsPage() {
  return (
    <AdminLayout>
      <Organizations />
    </AdminLayout>
  );
}

