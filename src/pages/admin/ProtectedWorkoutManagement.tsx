import { PermissionGuard } from '@/components/admin/PermissionGuard';
import WorkoutManagement from './WorkoutManagement';

export default function ProtectedWorkoutManagement() {
  return (
    <PermissionGuard permission="manage_workouts">
      <WorkoutManagement />
    </PermissionGuard>
  );
}