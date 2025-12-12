'use client';
export const dynamic = 'force-dynamic';
import AdminLayout from '@/components/AdminLayout';
import Cards from '@/components/admin/cards/page';

export default function CardsPage() {
  return (
    <AdminLayout>
      <Cards />
    </AdminLayout>
  );
}

