import React from 'react';
import { Copy } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

interface PixKeyProps {
  pixKey: {
    id: string;
    key_type: 'cpf' | 'email' | 'phone' | 'random';
    key_value: string;
    recipient_name: string;
    is_primary: boolean;
  } | null;
  isLoading: boolean;
}

const PaymentInfo: React.FC<PixKeyProps> = ({ pixKey, isLoading }) => {
  const handleCopyToClipboard = () => {
    if (pixKey?.key_value) {
      navigator.clipboard.writeText(pixKey.key_value);
      toast("Chave PIX copiada", { 
        description: "Chave PIX copiada para a área de transferência!" 
      });
    }
  };

  const getKeyTypeLabel = (type: 'cpf' | 'email' | 'phone' | 'random') => {
    switch (type) {
      case 'cpf': return 'CPF';
      case 'email': return 'Email';
      case 'phone': return 'Telefone';
      case 'random': return 'Chave Aleatória';
      default: return 'Chave PIX';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-20">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fitness-orange"></div>
      </div>
    );
  }

  if (!pixKey) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center bg-fitness-darkGray rounded-lg">
        <p className="mb-2 text-gray-400">Nenhuma chave PIX cadastrada</p>
        <p className="text-xs text-gray-500">Contacte o administrador para informações de pagamento</p>
      </div>
    );
  }

  return (
    <div className="bg-fitness-darkGray p-4 rounded-lg">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">Informações de Pagamento</h3>
        <p className="text-sm text-gray-400">Utilize a chave PIX abaixo para pagamento</p>
      </div>
      
      <div className="space-y-2">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">Favorecido</span>
          <span className="font-medium">{pixKey.recipient_name}</span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">{getKeyTypeLabel(pixKey.key_type)}</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{pixKey.key_value}</span>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 text-fitness-orange hover:text-fitness-orange/80 hover:bg-fitness-dark/50"
              onClick={handleCopyToClipboard}
            >
              <Copy size={14} />
              <span className="sr-only">Copiar chave PIX</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfo;
