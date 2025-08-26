import { PermissionGuard } from '@/components/admin/PermissionGuard';
import ProductManagement from './ProductManagement';

export default function ProtectedProductManagement() {
  return (
    <PermissionGuard permission="manage_products">
      <ProductManagement />
    </PermissionGuard>
  );
}