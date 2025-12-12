'use client';
export const dynamic = 'force-dynamic';
import AdminLayout from '@/components/AdminLayout';
import Users from '@/components/admin/users/page';

export default function UsersPage() {
  return (
    <AdminLayout>
      <Users />
    </AdminLayout>
  );
}

