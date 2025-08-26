import { PermissionGuard } from '@/components/admin/PermissionGuard';
import ExerciseManagement from './ExerciseManagement';

export default function ProtectedExerciseManagement() {
  return (
    <PermissionGuard permission="manage_exercises">
      <ExerciseManagement />
    </PermissionGuard>
  );
}