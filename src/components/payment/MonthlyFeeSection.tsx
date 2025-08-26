import React, { useState } from 'react';
import { Edit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast-wrapper';

interface MonthlyFeeSectionProps {
  savedMonthlyFee: string;
  setSavedMonthlyFee: (value: string) => void;
}

const MonthlyFeeSection = ({ savedMonthlyFee, setSavedMonthlyFee }: MonthlyFeeSectionProps) => {
  const [monthlyFee, setMonthlyFee] = useState('');
  const [isEditingFee, setIsEditingFee] = useState(false);
  
  // Don't allow users to edit monthly fee - only display it
  const isUserEditingDisabled = true;

  const handleSaveMonthlyFee = () => {
    if (!monthlyFee) {
      toast('Digite um valor de mensalidade válido');
      return;
    }
    
    setSavedMonthlyFee(monthlyFee);
    setIsEditingFee(false);
    toast('Valor da mensalidade salvo com sucesso');
  };

  return (
    <div className="bg-fitness-darkGray p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-3 flex items-center">
        <span>Mensalidade</span>
      </h2>
      
      <div className="p-3 bg-fitness-dark rounded-md">
        {savedMonthlyFee ? (
          <p className="text-lg font-medium">R$ {savedMonthlyFee}</p>
        ) : (
          <p className="text-gray-400">Valor definido pelo administrador</p>
        )}
      </div>
    </div>
  );
};

export default MonthlyFeeSection;
