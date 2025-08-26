import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Plus, Key, Copy, Clock, Receipt, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/lib/toast-wrapper';
import { DataTable } from '@/components/ui/data-table';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PaymentMethod {
  id: string;
  type: 'credit' | 'debit';
  cardNumber: string;
  expiryDate: string;
  holderName: string;
  isDefault: boolean;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  description: string;
}

interface PaymentSettings {
  accept_card_payments: boolean;
  accept_pix_payments: boolean;
  accept_monthly_fee: boolean;
  monthly_fee_amount: number;
}

interface PixKey {
  key_type: string;
  key_value: string;
  is_primary: boolean;
}

const Payment = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);

  // Fetch payment information
  useEffect(() => {
    const fetchPaymentData = async () => {
      setIsLoading(true);
      try {
        // Fetch payment settings from database
        const { data: settingsData, error: settingsError } = await supabase
          .from('payment_settings')
          .select('*')
          .single();
          
        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error('Error fetching payment settings:', settingsError);
          throw settingsError;
        }
        
        if (settingsData) {
          setSettings(settingsData);
          setMonthlyFee(settingsData.monthly_fee_amount?.toString() || '');
        } else {
          // Default settings if none found
          setSettings({
            accept_card_payments: true,
            accept_pix_payments: true,
            accept_monthly_fee: false,
            monthly_fee_amount: 0
          });
          setMonthlyFee('99.90');
        }
        
        // Fetch PIX key if PIX payments are enabled
        if (settingsData?.accept_pix_payments) {
          const { data: pixData, error: pixError } = await supabase
            .from('pix_keys')
            .select('key_type, key_value, is_primary')
            .eq('is_primary', true)
            .single();
            
          if (pixError && pixError.code !== 'PGRST116') {
            console.error('Error fetching PIX key:', pixError);
          } else if (pixData) {
            setPixKey(pixData.key_value);
            setPixKeyType(pixData.key_type);
          }
        }
        
        // Example payment methods - in real implementation fetch from database
        setPaymentMethods([
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

        // Fetch payment history - in real implementation fetch from orders table
        const { data: historyData, error: historyError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (historyError) {
          console.error('Error fetching payment history:', historyError);
        } else {
          // Transform data to match our PaymentHistory interface
          const transformedHistory = historyData?.map(order => ({
            id: order.id,
            date: order.created_at,
            amount: order.total_amount,
            status: order.status as 'completed' | 'pending' | 'failed',
            method: 'Cartão de Crédito',
            description: 'Mensalidade'
          })) || [];
          
          setPaymentHistory(transformedHistory.length > 0 ? transformedHistory : [
            {
              id: '1',
              date: '2025-05-01',
              amount: 99.9,
              status: 'completed',
              method: 'Cartão de Crédito',
              description: 'Mensalidade de Maio',
            },
            {
              id: '2',
              date: '2025-04-01',
              amount: 99.9,
              status: 'completed',
              method: 'PIX',
              description: 'Mensalidade de Abril',
            },
            {
              id: '3',
              date: '2025-03-01',
              amount: 99.9,
              status: 'completed',
              method: 'Cartão de Crédito',
              description: 'Mensalidade de Março',
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching payment data:', error);
        toast('Falha ao carregar dados de pagamento');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPaymentData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    toast('Chave PIX copiada!');
  };

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

  const paymentHistoryColumns = [
    {
      accessorKey: 'date',
      header: 'Data',
      cell: ({ row }: { row: { original: PaymentHistory } }) => {
        const date = new Date(row.original.date);
        return <span>{date.toLocaleDateString('pt-BR')}</span>;
      },
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
    },
    {
      accessorKey: 'amount',
      header: 'Valor',
      cell: ({ row }: { row: { original: PaymentHistory } }) => (
        <span>R$ {row.original.amount.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'method',
      header: 'Método',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: PaymentHistory } }) => {
        let statusColor = 'text-gray-500';
        let statusText = 'Pendente';
        
        if (row.original.status === 'completed') {
          statusColor = 'text-green-500';
          statusText = 'Concluído';
        } else if (row.original.status === 'failed') {
          statusColor = 'text-red-500';
          statusText = 'Falhou';
        }
        
        return <span className={statusColor}>{statusText}</span>;
      },
    },
  ];
  
  if (isLoading) {
    return (
      <main className="container">
        <section className="mobile-section">
          <div className="mb-6 flex items-center">
            <Link to="/profile" className="mr-2">
              <ArrowLeft className="text-fitness-orange" />
            </Link>
            <h1 className="text-2xl font-bold">Pagamentos</h1>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-orange"></div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="mobile-section">
        <div className="mb-6 flex items-center">
          <Link to="/profile" className="mr-2">
            <ArrowLeft className="text-fitness-orange" />
          </Link>
          <h1 className="text-2xl font-bold">Pagamentos</h1>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="methods">Métodos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          {/* Informações de Pagamento Tab */}
          <TabsContent value="info">
            <div className="space-y-4">
              {/* Mensalidade Card */}
              {settings?.accept_monthly_fee && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Mensalidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-fitness-dark rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Valor mensal</p>
                        <p className="text-xl font-bold text-fitness-orange">R$ {monthlyFee}</p>
                      </div>
                      <div className="bg-fitness-darkGray p-2 rounded-full">
                        <Receipt className="h-6 w-6 text-fitness-orange" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">Próximo pagamento em: 01/06/2025</p>
                  </CardContent>
                </Card>
              )}
              
              {/* PIX Card */}
              {settings?.accept_pix_payments && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Key size={18} className="mr-2 text-fitness-orange" />
                      Chave PIX
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-fitness-dark rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-400 text-sm">
                            {pixKeyType === 'cpf' ? 'CPF' : 
                             pixKeyType === 'cnpj' ? 'CNPJ' : 
                             pixKeyType === 'email' ? 'Email' : 
                             pixKeyType === 'phone' ? 'Telefone' : 'Chave Aleatória'}
                          </p>
                          <p className="font-medium">{pixKey}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-fitness-orange hover:text-fitness-orange/80 hover:bg-fitness-darkGray"
                          onClick={handleCopyPixKey}
                        >
                          <Copy size={18} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-fitness-dark p-4 rounded-lg">
                      <p className="text-sm text-center mb-3">Escanear QR Code PIX</p>
                      <div className="bg-white rounded-lg p-2 w-48 h-48 mx-auto">
                        <AspectRatio ratio={1/1}>
                          <div className="flex items-center justify-center h-full w-full">
                            <QrCode size={24} className="text-gray-400" />
                            <span className="ml-2 text-sm text-gray-400">QR Code PIX</span>
                          </div>
                        </AspectRatio>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          {/* Métodos de Pagamento Tab */}
          <TabsContent value="methods">
            <div className="space-y-4">
              {settings?.accept_card_payments ? (
                <>
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
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
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

                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="w-full bg-fitness-darkGray hover:bg-fitness-dark border border-dashed border-gray-600 flex items-center justify-center gap-2 py-6"
                  >
                    <Plus size={20} />
                    <span>Adicionar cartão</span>
                  </Button>
                </>
              ) : (
                <div className="bg-fitness-dark p-6 rounded-lg text-center">
                  <p>Pagamentos com cartão estão desativados</p>
                  <p className="text-sm text-gray-400 mt-1">
                    No momento, a academia não está aceitando pagamentos com cartão.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Histórico de Pagamentos Tab */}
          <TabsContent value="history">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Clock size={18} className="mr-2 text-fitness-orange" />
                    Histórico de Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentHistory.length > 0 ? (
                    <DataTable
                      columns={paymentHistoryColumns}
                      data={paymentHistory}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p>Nenhum histórico de pagamento encontrado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default Payment;
