import AdminLayout from './layout-admin';
import AdminDashboard from './dashboard/page';

export default function AdminHome() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}

