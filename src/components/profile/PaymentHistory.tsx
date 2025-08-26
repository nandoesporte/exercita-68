import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

interface Payment {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
}

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setPayments(data || []);
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error);
        toast("Erro ao carregar histórico", {
          description: "Erro ao carregar histórico de pagamentos"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPayments();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'cancelled':
      case 'refunded':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-fitness-orange"></div>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center p-6 bg-fitness-darkGray rounded-lg">
        <p className="text-gray-400">Nenhum pagamento registrado</p>
      </div>
    );
  }

  return (
    <div className="bg-fitness-darkGray rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold">Histórico de Pagamentos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-fitness-dark">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium text-gray-300">Data</th>
              <th className="py-3 px-4 text-right text-sm font-medium text-gray-300">Valor</th>
              <th className="py-3 px-4 text-right text-sm font-medium text-gray-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-gray-800">
                <td className="py-3 px-4 text-sm">
                  {format(new Date(payment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  R$ {payment.total_amount.toFixed(2).replace('.', ',')}
                </td>
                <td className={`py-3 px-4 text-sm text-right ${getStatusColor(payment.status)}`}>
                  {getStatusLabel(payment.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistory;
