import { PermissionGuard } from '@/components/admin/PermissionGuard';
import AppointmentManagement from './AppointmentManagement';

export default function ProtectedAppointmentManagement() {
  return (
    <PermissionGuard permission="manage_appointments">
      <AppointmentManagement />
    </PermissionGuard>
  );
}