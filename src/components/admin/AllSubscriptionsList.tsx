import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle2, X, Clock, AlertTriangle, Power, PowerOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

export function AllSubscriptionsList() {
  const { isSuperAdmin } = useAdminRole();
  const { allSubscriptions, isLoadingAllSubscriptions, toggleSubscriptionStatus } = useSubscriptionPlans();
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);

  if (!isSuperAdmin) {
    return null;
  }

  if (isLoadingAllSubscriptions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Todas as Assinaturas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string, endDate?: string) => {
    switch (status) {
      case 'active':
        const isExpired = endDate && new Date(endDate) < new Date();
        return isExpired 
          ? <AlertTriangle className="h-4 w-4 text-yellow-500" />
          : <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'expired':
      case 'cancelled':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string, endDate?: string) => {
    switch (status) {
      case 'active':
        const isExpired = endDate && new Date(endDate) < new Date();
        return isExpired 
          ? <Badge variant="destructive">Expirada</Badge>
          : <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pendente</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleToggleStatus = (subscriptionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'cancelled' : 'active';
    toggleSubscriptionStatus({ subscriptionId, newStatus });
    setSelectedSubscription(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assinaturas dos Administradores</CardTitle>
        <CardDescription>
          Gerencie o status das assinaturas de todos os administradores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {allSubscriptions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma assinatura encontrada
          </p>
        ) : (
          <div className="space-y-4">
            {allSubscriptions.map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(subscription.status, subscription.end_date || undefined)}
                    <h4 className="font-medium">
                      {subscription.admins?.name || 'Admin Desconhecido'}
                    </h4>
                    {getStatusBadge(subscription.status, subscription.end_date || undefined)}
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Email: {subscription.admins?.email || 'N/A'}</p>
                    {subscription.subscription_plans && (
                      <p>
                        Plano: {subscription.subscription_plans.name} - {formatPrice(subscription.subscription_plans.price)}
                      </p>
                    )}
                    {subscription.start_date && (
                      <p>
                        Início: {format(new Date(subscription.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    )}
                    {subscription.end_date && (
                      <p>
                        {subscription.status === 'active' && new Date(subscription.end_date) > new Date() 
                          ? 'Expira em: ' 
                          : 'Expirou em: '
                        }
                        {format(new Date(subscription.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={subscription.status === 'active' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => setSelectedSubscription(subscription.id)}
                      >
                        {subscription.status === 'active' ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {subscription.status === 'active' ? 'Desativar' : 'Ativar'} Assinatura
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja {subscription.status === 'active' ? 'desativar' : 'ativar'} a assinatura de {subscription.admins?.name}?
                          {subscription.status === 'active' && ' Isso impedirá o acesso do administrador ao sistema.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedSubscription(null)}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleToggleStatus(subscription.id, subscription.status)}
                          className={subscription.status === 'active' ? 'bg-destructive hover:bg-destructive/90' : ''}
                        >
                          {subscription.status === 'active' ? 'Desativar' : 'Ativar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}