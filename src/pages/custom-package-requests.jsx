'use client';
export const dynamic = 'force-dynamic';
import AdminLayout from '@/components/AdminLayout';
import CustomPackageRequests from '@/components/admin/customPackageRequests/page';

export default function CustomPackageRequestsPage() {
  return (
    <AdminLayout>
      <CustomPackageRequests />
    </AdminLayout>
  );
}






