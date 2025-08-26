
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreditCard, Wallet } from 'lucide-react';
import PaymentInfo from './PaymentInfo';
import PaymentHistory from './PaymentHistory';
import MonthlyFeeSection from '@/components/payment/MonthlyFeeSection';

interface PaymentTabsProps {
  pixKey: {
    id: string;
    key_type: 'cpf' | 'email' | 'phone' | 'random';
    key_value: string;
    recipient_name: string;
    is_primary: boolean;
  } | null;
  isLoadingPixKey: boolean;
}

const PaymentTabs: React.FC<PaymentTabsProps> = ({ pixKey, isLoadingPixKey }) => {
  const [savedMonthlyFee, setSavedMonthlyFee] = useState('99.90');

  return (
    <div className="mb-8">
      <div className="bg-green-600 rounded-xl p-6 mx-auto max-w-md">
        <h3 className="text-lg font-semibold mb-4 text-white text-center">Pagamento ao Personal</h3>
        <div className="space-y-4">
          <PaymentInfo pixKey={pixKey} isLoading={isLoadingPixKey} />
          <MonthlyFeeSection 
            savedMonthlyFee={savedMonthlyFee} 
            setSavedMonthlyFee={setSavedMonthlyFee} 
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentTabs;
