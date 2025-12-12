'use client';
export const dynamic = 'force-dynamic';
import AdminLayout from '@/components/AdminLayout';
import Demos from '@/components/admin/demos/page';

export default function DemosPage() {
  return (
    <AdminLayout>
      <Demos />
    </AdminLayout>
  );
}

