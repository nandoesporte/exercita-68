import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/lib/toast-wrapper';
import { Loader2, Clipboard, CheckCircle, CreditCard, QrCode } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PixKey {
  id?: string;
  key_type: 'cpf' | 'email' | 'phone' | 'random';
  key_value: string;
  recipient_name: string;
  is_primary: boolean;
  created_at?: string;
}

interface PaymentSettings {
  id?: string;
  accept_card_payments: boolean;
  accept_pix_payments: boolean;
  accept_monthly_fee: boolean;
  monthly_fee_amount: number;
}

// Type for database response
interface PixKeyFromDB {
  id: string;
  key_type: string;
  key_value: string;
  recipient_name: string;
  is_primary: boolean;
  created_at: string;
}

const PaymentMethodManagement = () => {
  const [pixKeys, setPixKeys] = useState<PixKey[]>([]);
  const [keyType, setKeyType] = useState<PixKey['key_type']>('cpf');
  const [keyValue, setKeyValue] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [savingPixKey, setSavingPixKey] = useState(false);
  const [acceptCardPayments, setAcceptCardPayments] = useState(false);
  const [acceptPixPayments, setAcceptPixPayments] = useState(false);
  const [acceptMonthlyFee, setAcceptMonthlyFee] = useState(false);
  const [monthlyFeeAmount, setMonthlyFeeAmount] = useState(0);
  const [savingSettings, setSavingSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    fetchPixKeys();
    fetchPaymentSettings();
  }, []);

  const fetchPixKeys = async () => {
    try {
      console.log("Fetching PIX keys...");
      
      // Get current admin's ID first
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();
        
      if (adminError || !adminData) {
        console.error("Error fetching admin data:", adminError);
        setPixKeys([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('pix_keys')
        .select('*')
        .eq('admin_id', adminData.id)
        .order('is_primary', { ascending: false });

      if (error) {
        console.error("Error fetching PIX keys:", error);
        throw error;
      }
      
      console.log("PIX keys fetched:", data);
      
      // Transform the data to ensure key_type is the correct union type
      const formattedData = data?.map((item: PixKeyFromDB) => ({
        id: item.id,
        key_type: item.key_type as 'cpf' | 'email' | 'phone' | 'random',
        key_value: item.key_value,
        recipient_name: item.recipient_name,
        is_primary: item.is_primary || false,
        created_at: item.created_at
      }));
      
      setPixKeys(formattedData || []);
    } catch (error) {
      console.error('Error fetching pix keys:', error);
      toast("Erro ao carregar chaves PIX.");
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      // Get current admin's ID first
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();
        
      if (adminError || !adminData) {
        console.error("Error fetching admin data:", adminError);
        return;
      }
      
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('admin_id', adminData.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setAcceptCardPayments(data.accept_card_payments || false);
        setAcceptPixPayments(data.accept_pix_payments || false);
        setAcceptMonthlyFee(data.accept_monthly_fee || false);
        setMonthlyFeeAmount(data.monthly_fee_amount || 0);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      toast("Erro ao carregar configurações de pagamento.");
    }
  };

  const handleSavePixKey = async () => {
    if (!keyType || !keyValue || !recipientName) {
      toast("Preencha todos os campos da chave PIX.");
      return;
    }

    setSavingPixKey(true);
    
    try {
      console.log("Saving PIX key with:", { keyType, keyValue, recipientName });
      
      const newKey: PixKey = {
        key_type: keyType,
        key_value: keyValue,
        recipient_name: recipientName,
        is_primary: pixKeys.length === 0, // First key is primary
      };

      // Usar a função segura para contornar a política RLS
      if (isAdmin && user) {
        const { data, error } = await supabase.rpc('admin_add_pix_key', {
          p_key_type: keyType,
          p_key_value: keyValue,
          p_recipient_name: recipientName,
          p_is_primary: pixKeys.length === 0
        });
        
        if (error) {
          console.error('Error saving PIX key:', error);
          throw error;
        }
        
        console.log("PIX key saved successfully:", data);
        toast("Chave PIX adicionada com sucesso!");
      } else {
        toast("Você não tem permissão para adicionar chaves PIX.");
        return;
      }
      
      // Reset form and refresh keys
      setKeyType('cpf');
      setKeyValue('');
      setRecipientName('');
      fetchPixKeys();
    } catch (error: any) {
      console.error('Error saving pix key:', error);
      toast(`Erro ao salvar chave PIX: ${error.message || 'Falha desconhecida'}`);
    } finally {
      setSavingPixKey(false);
    }
  };

  const handleSetPrimaryPixKey = async (id: string) => {
    try {
      console.log("Setting primary PIX key:", id);
      
      if (!isAdmin || !user) {
        toast("Você não tem permissão para definir a chave principal.");
        return;
      }
      
      // Usar a função segura para contornar a política RLS
      const { error } = await supabase.rpc('admin_set_primary_pix_key', {
        p_pix_key_id: id
      });
      
      if (error) {
        console.error('Error setting primary key:', error);
        throw error;
      }
      
      console.log("Primary PIX key updated successfully");
      toast("Chave principal atualizada!");
      fetchPixKeys();
    } catch (error: any) {
      console.error('Error setting primary key:', error);
      toast(`Erro ao definir chave principal: ${error.message || 'Falha desconhecida'}`);
    }
  };

  const handleDeletePixKey = async (id: string) => {
    try {
      console.log("Deleting PIX key:", id);
      
      if (!isAdmin || !user) {
        toast("Você não tem permissão para remover chaves PIX.");
        return;
      }
      
      // Usar a função segura para contornar a política RLS
      const { error } = await supabase.rpc('admin_delete_pix_key', {
        p_pix_key_id: id
      });
        
      if (error) {
        console.error('Error deleting PIX key:', error);
        throw error;
      }
      
      console.log("PIX key deleted successfully");
      toast("Chave PIX removida com sucesso!");
      fetchPixKeys();
    } catch (error: any) {
      console.error('Error deleting pix key:', error);
      toast(`Erro ao remover chave PIX: ${error.message || 'Falha desconhecida'}`);
    }
  };

  const savePaymentSettings = async () => {
    setSavingSettings(true);
    
    try {
      if (!isAdmin || !user) {
        toast("Você não tem permissão para salvar configurações de pagamento.");
        setSavingSettings(false);
        return;
      }
      
      // Usar a função segura para contornar a política RLS
      const { error } = await supabase.rpc('admin_save_payment_settings', {
        p_accept_card: acceptCardPayments,
        p_accept_pix: acceptPixPayments,
        p_accept_monthly_fee: acceptMonthlyFee,
        p_monthly_fee_amount: monthlyFeeAmount
      });
      
      if (error) throw error;
      
      toast("Configurações de pagamento salvas com sucesso!");
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast("Erro ao salvar configurações de pagamento.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Chave copiada para a área de transferência!");
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (err) {
      console.error('Falha ao copiar a chave: ', err);
      toast("Falha ao copiar a chave para a área de transferência.");
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Gerenciar Métodos de Pagamento</h1>
        <p className="text-lg text-muted-foreground">Configure e gerencie as formas de pagamento aceitas em sua plataforma</p>
      </div>

      <Tabs defaultValue="pix" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="pix" className="text-base font-medium">PIX</TabsTrigger>
          <TabsTrigger value="settings" className="text-base font-medium">Configurações</TabsTrigger>
        </TabsList>
        
        {/* PIX Management Tab */}
        <TabsContent value="pix" className="space-y-6">
          <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <QrCode className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">Chaves PIX Cadastradas</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Gerencie as chaves PIX que seus clientes podem usar para pagar
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {pixKeys.length > 0 ? (
                <div className="grid gap-4">
                  {pixKeys.map((key) => (
                    <Card key={key.id} className="border-2 border-border/50 bg-card hover:shadow-md transition-all duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            {key.is_primary ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                <span className="text-lg font-semibold text-foreground">Chave Principal</span>
                              </div>
                            ) : (
                              <span className="text-lg font-medium text-muted-foreground">Chave Secundária</span>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-muted-foreground">Recebedor:</span>
                              <span className="text-foreground font-medium">{key.recipient_name}</span>
                            </div>
                          </div>
                          
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeletePixKey(key.id || '')}
                            className="shrink-0"
                          >
                            Remover
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                              {key.key_type === 'cpf' ? 'CPF' : 
                               key.key_type === 'email' ? 'Email' : 
                               key.key_type === 'phone' ? 'Telefone' : 
                               'Chave Aleatória'}
                            </p>
                            <p className="text-lg font-mono font-medium text-foreground break-all">
                              {key.key_value}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleCopyToClipboard(key.key_value)}
                            disabled={copied}
                            className="shrink-0 ml-3 hover:bg-primary/10"
                          >
                            {copied ? (
                              <CheckCircle className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <Clipboard className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                        {!key.is_primary && (
                          <Button 
                            onClick={() => handleSetPrimaryPixKey(key.id || '')}
                            variant="outline"
                            className="w-full"
                          >
                            Definir como Principal
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <QrCode className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">Nenhuma chave PIX cadastrada</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Adicione sua primeira chave PIX abaixo</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">Adicionar Nova Chave PIX</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Adicione uma nova chave PIX para receber pagamentos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="keyType" className="text-sm font-medium text-foreground">Tipo de Chave</Label>
                  <select
                    id="keyType"
                    className="flex h-11 w-full rounded-lg border-2 border-border bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    value={keyType}
                    onChange={(e) => setKeyType(e.target.value as PixKey['key_type'])}
                  >
                    <option value="cpf">CPF</option>
                    <option value="email">Email</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Chave Aleatória</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyValue" className="text-sm font-medium text-foreground">Chave PIX</Label>
                  <Input
                    type="text"
                    id="keyValue"
                    placeholder={`Digite a chave PIX (${keyType === 'cpf' ? 'CPF' : keyType === 'email' ? 'Email' : keyType === 'phone' ? 'Telefone' : 'Chave Aleatória'})`}
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                    className="h-11 text-base border-2 border-border focus-visible:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientName" className="text-sm font-medium text-foreground">Nome do Recebedor</Label>
                <Input
                  type="text"
                  id="recipientName"
                  placeholder="Nome completo do recebedor"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="h-11 text-base border-2 border-border focus-visible:ring-primary"
                />
              </div>
              <Button 
                onClick={handleSavePixKey} 
                disabled={savingPixKey}
                className="w-full h-11 text-base font-medium"
                size="lg"
              >
                {savingPixKey ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Adicionar Chave PIX'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">Configurações de Pagamento</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Configure os métodos de pagamento aceitos na sua plataforma
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="acceptCardPayments" className="text-base font-medium text-foreground">Aceitar Pagamentos com Cartão</Label>
                    <p className="text-sm text-muted-foreground">Permita pagamentos com cartão de crédito e débito</p>
                  </div>
                  <Switch
                    id="acceptCardPayments"
                    checked={acceptCardPayments}
                    onCheckedChange={setAcceptCardPayments}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="acceptPixPayments" className="text-base font-medium text-foreground">Aceitar Pagamentos com PIX</Label>
                    <p className="text-sm text-muted-foreground">Receba pagamentos instantâneos via PIX</p>
                  </div>
                  <Switch
                    id="acceptPixPayments"
                    checked={acceptPixPayments}
                    onCheckedChange={setAcceptPixPayments}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="acceptMonthlyFee" className="text-base font-medium text-foreground">Cobrar Mensalidade</Label>
                    <p className="text-sm text-muted-foreground">Configure uma mensalidade fixa para seus clientes</p>
                  </div>
                  <Switch
                    id="acceptMonthlyFee"
                    checked={acceptMonthlyFee}
                    onCheckedChange={setAcceptMonthlyFee}
                  />
                </div>
              </div>

              {acceptMonthlyFee && (
                <div className="space-y-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <Label htmlFor="monthlyFeeAmount" className="text-base font-medium text-foreground">Valor da Mensalidade (R$)</Label>
                  <Input
                    type="number"
                    id="monthlyFeeAmount"
                    placeholder="Ex: 99.90"
                    value={monthlyFeeAmount.toString()}
                    onChange={(e) => setMonthlyFeeAmount(Number(e.target.value))}
                    className="h-11 text-base border-2 border-border focus-visible:ring-primary"
                  />
                </div>
              )}

              <Button 
                onClick={savePaymentSettings} 
                disabled={savingSettings}
                className="w-full h-11 text-base font-medium"
                size="lg"
              >
                {savingSettings ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentMethodManagement;
