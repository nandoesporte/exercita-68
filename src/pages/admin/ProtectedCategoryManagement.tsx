import { PermissionGuard } from '@/components/admin/PermissionGuard';
import CategoryManagement from './CategoryManagement';

export default function ProtectedCategoryManagement() {
  return (
    <PermissionGuard permission="manage_categories">
      <CategoryManagement />
    </PermissionGuard>
  );
}