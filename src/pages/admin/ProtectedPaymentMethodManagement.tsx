import { PermissionGuard } from '@/components/admin/PermissionGuard';
import PaymentMethodManagement from './PaymentMethodManagement';

export default function ProtectedPaymentMethodManagement() {
  return (
    <PermissionGuard permission="manage_payment_methods">
      <PaymentMethodManagement />
    </PermissionGuard>
  );
}