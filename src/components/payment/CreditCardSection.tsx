
import React from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddCardForm from './AddCardForm';
import { toast } from '@/lib/toast-wrapper';

interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit';
  cardNumber: string;
  expiryDate: string;
  holderName: string;
  isDefault: boolean;
}

interface CreditCardSectionProps {
  paymentMethods: PaymentMethod[];
  setPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  showAddForm: boolean;
  setShowAddForm: React.Dispatch<React.SetStateAction<boolean>>;
}

const CreditCardSection = ({
  paymentMethods,
  setPaymentMethods,
  showAddForm,
  setShowAddForm
}: CreditCardSectionProps) => {
  
  const handleDelete = (id: string) => {
    setPaymentMethods(paymentMethods.filter((method) => method.id !== id));
    toast('Cartão removido com sucesso');
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(
      paymentMethods.map((method) => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
    toast('Cartão padrão alterado');
  };

  const handleAddCard = (newPaymentMethod: PaymentMethod) => {
    setPaymentMethods([...paymentMethods, {
      ...newPaymentMethod,
      isDefault: paymentMethods.length === 0,
    }]);
    setShowAddForm(false);
    toast('Cartão adicionado com sucesso');
  };

  return (
    <>
      <div className="bg-fitness-darkGray p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <CreditCard size={18} className="mr-2 text-fitness-orange" />
          <span>Cartões</span>
        </h2>
        
        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`bg-fitness-darkGray p-4 rounded-lg border ${
                  method.isDefault ? 'border-fitness-orange' : 'border-transparent'
                }`}
              >
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-fitness-orange mr-3" />
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold">{method.cardNumber}</p>
                        {method.isDefault && (
                          <span className="bg-fitness-orange text-white text-xs px-2 py-0.5 rounded-full">
                            Padrão
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {method.type === 'credit' ? 'Crédito' : 'Débito'} • Exp: {method.expiryDate}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                {!method.isDefault && (
                  <Button
                    onClick={() => handleSetDefault(method.id)}
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-fitness-orange hover:text-fitness-orange/90 hover:bg-transparent p-0"
                  >
                    Definir como padrão
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-fitness-dark p-6 rounded-lg text-center">
            <CreditCard className="h-10 w-10 text-fitness-orange mx-auto mb-3" />
            <p>Nenhum cartão cadastrado</p>
            <p className="text-sm text-gray-400 mt-1">
              Adicione um cartão para pagar por serviços premium
            </p>
          </div>
        )}
      </div>

      {showAddForm ? (
        <AddCardForm onAddCard={handleAddCard} onCancel={() => setShowAddForm(false)} />
      ) : (
        <Button
          onClick={() => setShowAddForm(true)}
          className="w-full bg-fitness-darkGray hover:bg-fitness-dark border border-dashed border-gray-600 flex items-center justify-center gap-2 py-6"
        >
          <Plus size={20} />
          <span>Adicionar cartão</span>
        </Button>
      )}
    </>
  );
};

export default CreditCardSection;
