import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, CreditCard, AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SubscriptionStatusCard() {
  const { isSuperAdmin } = useAdminRole();
  const {
    currentSubscription,
    isLoadingSubscription,
    plans,
    subscribeToplan,
    isSubscribing,
    checkSubscriptionStatus,
    hasActiveSubscription
  } = useSubscriptionPlans();

  // Super Admin não precisa de assinatura
  if (isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Status da Assinatura
          </CardTitle>
          <CardDescription>Você é Super Admin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Acesso Total
            </Badge>
            <p className="text-sm text-muted-foreground">
              Super Admins têm acesso irrestrito ao sistema
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status da Assinatura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (!currentSubscription) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    
    switch (currentSubscription.status) {
      case 'active':
        return hasActiveSubscription 
          ? <CheckCircle2 className="h-5 w-5 text-green-500" />
          : <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'expired':
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    if (!currentSubscription) {
      return <Badge variant="destructive">Sem Assinatura</Badge>;
    }
    
    switch (currentSubscription.status) {
      case 'active':
        return hasActiveSubscription 
          ? <Badge className="bg-green-100 text-green-800">Ativa</Badge>
          : <Badge variant="destructive">Expirada</Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pendente</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Status Desconhecido</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            Status da Assinatura
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => checkSubscriptionStatus()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          Gerencie sua assinatura para manter o acesso ao sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>

        {currentSubscription && (
          <>
            {currentSubscription.subscription_plans && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plano:</span>
                <span className="text-sm">
                  {currentSubscription.subscription_plans.name} - {formatPrice(currentSubscription.subscription_plans.price)}
                </span>
              </div>
            )}
            
            {currentSubscription.end_date && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {hasActiveSubscription ? 'Renovação em:' : 'Expirou em:'}
                </span>
                <span className="text-sm">
                  {format(new Date(currentSubscription.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({formatDistanceToNow(new Date(currentSubscription.end_date), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })})
                  </span>
                </span>
              </div>
            )}
            
            {currentSubscription.start_date && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Início:</span>
                <span className="text-sm">
                  {format(new Date(currentSubscription.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
          </>
        )}

        <div className="pt-4 border-t">
          {!hasActiveSubscription ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {currentSubscription 
                  ? 'Sua assinatura expirou. Renove para continuar acessando o sistema.'
                  : 'Você precisa de uma assinatura ativa para acessar o sistema.'
                }
              </p>
              
              {plans.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Escolha um plano:</p>
                  <div className="grid gap-2">
                    {plans.map((plan) => (
                      <div 
                        key={plan.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(plan.price)} por {plan.duration_days} dias
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => subscribeToplan(plan.id)}
                          disabled={isSubscribing}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {isSubscribing ? 'Processando...' : 'Assinar'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-green-600">
                ✅ Sua assinatura está ativa! Você tem acesso completo ao sistema.
              </p>
              
              {plans.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Renovar ou alterar plano:</p>
                  <div className="grid gap-2">
                    {plans.map((plan) => (
                      <div 
                        key={plan.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(plan.price)} por {plan.duration_days} dias
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => subscribeToplan(plan.id)}
                          disabled={isSubscribing}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {isSubscribing ? 'Processando...' : 'Renovar'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}