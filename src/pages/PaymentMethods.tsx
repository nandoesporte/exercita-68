
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import MonthlyFeeSection from '@/components/payment/MonthlyFeeSection';
import PixKeySection from '@/components/payment/PixKeySection';
import CreditCardSection from '@/components/payment/CreditCardSection';

interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit';
  cardNumber: string;
  expiryDate: string;
  holderName: string;
  isDefault: boolean;
}

const PaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'credit',
      cardNumber: '**** **** **** 1234',
      expiryDate: '12/25',
      holderName: 'João Silva',
      isDefault: true,
    },
    {
      id: '2',
      type: 'debit',
      cardNumber: '**** **** **** 5678',
      expiryDate: '09/24',
      holderName: 'João Silva',
      isDefault: false,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  
  // PIX management state
  const [savedPixKey, setSavedPixKey] = useState('');
  const [savedPixKeyType, setSavedPixKeyType] = useState('cpf');
  
  // Monthly fee state
  const [savedMonthlyFee, setSavedMonthlyFee] = useState('');

  return (
    <main className="container">
      <section className="mobile-section">
        <div className="mb-6 flex items-center">
          <Link to="/profile" className="mr-2">
            <ArrowLeft className="text-fitness-orange" />
          </Link>
          <h1 className="text-2xl font-bold">Métodos de Pagamento</h1>
        </div>

        <div className="space-y-6">
          {/* Monthly Fee Section */}
          <MonthlyFeeSection 
            savedMonthlyFee={savedMonthlyFee} 
            setSavedMonthlyFee={setSavedMonthlyFee}
          />
          
          {/* PIX Key Section */}
          <PixKeySection 
            savedPixKey={savedPixKey}
            setSavedPixKey={setSavedPixKey}
            savedPixKeyType={savedPixKeyType}
            setSavedPixKeyType={setSavedPixKeyType}
          />
          
          {/* Credit Card Section */}
          <CreditCardSection 
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
          />
        </div>
      </section>
    </main>
  );
};

export default PaymentMethods;
