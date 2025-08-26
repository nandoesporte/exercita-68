import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast-wrapper';

interface AddCardFormProps {
  onAddCard: (card: {
    id: string;
    type: 'credit' | 'debit';
    cardNumber: string;
    expiryDate: string;
    holderName: string;
    isDefault: boolean;
  }) => void;
  onCancel: () => void;
}

const AddCardForm = ({ onAddCard, onCancel }: AddCardFormProps) => {
  const [newCard, setNewCard] = useState({
    type: 'credit',
    cardNumber: '',
    expiryDate: '',
    holderName: '',
    cvv: '',
  });

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!newCard.cardNumber || !newCard.expiryDate || !newCard.holderName || !newCard.cvv) {
      toast('Preencha todos os campos');
      return;
    }

    // Create new payment method
    onAddCard({
      id: Date.now().toString(),
      type: newCard.type as 'credit' | 'debit',
      cardNumber: `**** **** **** ${newCard.cardNumber.slice(-4)}`,
      expiryDate: newCard.expiryDate,
      holderName: newCard.holderName,
      isDefault: false,
    });

    // Reset form
    setNewCard({
      type: 'credit',
      cardNumber: '',
      expiryDate: '',
      holderName: '',
      cvv: '',
    });
  };

  return (
    <div className="bg-fitness-darkGray p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Adicionar Novo Cartão</h2>
      <form onSubmit={handleAddCard} className="space-y-4">
        <div>
          <label htmlFor="cardType" className="block text-sm mb-1">
            Tipo de Cartão
          </label>
          <select
            id="cardType"
            value={newCard.type}
            onChange={(e) => setNewCard({ ...newCard, type: e.target.value })}
            className="w-full bg-fitness-dark border border-gray-700 rounded p-2"
          >
            <option value="credit">Cartão de Crédito</option>
            <option value="debit">Cartão de Débito</option>
          </select>
        </div>

        <div>
          <label htmlFor="cardNumber" className="block text-sm mb-1">
            Número do Cartão
          </label>
          <Input
            id="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={newCard.cardNumber}
            onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
            className="bg-fitness-dark border-gray-700"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiryDate" className="block text-sm mb-1">
              Validade
            </label>
            <Input
              id="expiryDate"
              placeholder="MM/AA"
              value={newCard.expiryDate}
              onChange={(e) => setNewCard({ ...newCard, expiryDate: e.target.value })}
              className="bg-fitness-dark border-gray-700"
            />
          </div>
          <div>
            <label htmlFor="cvv" className="block text-sm mb-1">
              CVV
            </label>
            <Input
              id="cvv"
              placeholder="123"
              value={newCard.cvv}
              onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
              className="bg-fitness-dark border-gray-700"
            />
          </div>
        </div>

        <div>
          <label htmlFor="holderName" className="block text-sm mb-1">
            Nome no Cartão
          </label>
          <Input
            id="holderName"
            placeholder="JOÃO A SILVA"
            value={newCard.holderName}
            onChange={(e) => setNewCard({ ...newCard, holderName: e.target.value })}
            className="bg-fitness-dark border-gray-700"
          />
        </div>

        <div className="flex space-x-3 pt-2">
          <Button type="submit" className="flex-1 bg-fitness-orange hover:bg-fitness-orange/90">
            Salvar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddCardForm;
