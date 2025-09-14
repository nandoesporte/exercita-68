import { PermissionGuard } from '@/components/admin/PermissionGuard';
import AdminWorkoutHistory from './AdminWorkoutHistory';

export default function ProtectedAdminWorkoutHistory() {
  return (
    <PermissionGuard permission="manage_workouts">
      <AdminWorkoutHistory />
    </PermissionGuard>
  );
}