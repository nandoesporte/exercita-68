import { PermissionGuard } from '@/components/admin/PermissionGuard';
import ScheduleManagement from './ScheduleManagement';

export default function ProtectedScheduleManagement() {
  return (
    <PermissionGuard permission="manage_schedule">
      <ScheduleManagement />
    </PermissionGuard>
  );
}