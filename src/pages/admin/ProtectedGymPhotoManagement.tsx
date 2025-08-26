import { PermissionGuard } from '@/components/admin/PermissionGuard';
import GymPhotoManagement from './GymPhotoManagement';

export default function ProtectedGymPhotoManagement() {
  return (
    <PermissionGuard permission="manage_gym_photos">
      <GymPhotoManagement />
    </PermissionGuard>
  );
}