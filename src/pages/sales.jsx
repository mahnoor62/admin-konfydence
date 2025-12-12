'use client';
export const dynamic = 'force-dynamic';
import AdminLayout from '@/components/AdminLayout';
import Sales from '@/components/admin/sales/page';

export default function SalesPage() {
  return (
    <AdminLayout>
      <Sales />
    </AdminLayout>
  );
}

