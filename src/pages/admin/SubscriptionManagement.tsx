import { useAdminRole } from '@/hooks/useAdminRole';
import { SubscriptionPlansManagement } from '@/components/admin/SubscriptionPlansManagement';
import { SubscriptionStatusCard } from '@/components/admin/SubscriptionStatusCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SubscriptionManagement() {
  const { isSuperAdmin } = useAdminRole();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Assinaturas</h1>
        <p className="text-muted-foreground">
          {isSuperAdmin 
            ? 'Configure planos e monitore assinaturas dos administradores'
            : 'Gerencie sua assinatura para manter acesso ao sistema'
          }
        </p>
      </div>

      {isSuperAdmin ? (
        <Tabs defaultValue="plans" className="w-full">
          <TabsList>
            <TabsTrigger value="plans">Planos de Assinatura</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas Ativas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plans" className="space-y-6">
            <SubscriptionPlansManagement />
          </TabsContent>
          
          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assinaturas dos Administradores</CardTitle>
                <CardDescription>
                  Monitore o status das assinaturas de todos os administradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Lista de assinaturas será implementada em breve...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="max-w-2xl">
          <SubscriptionStatusCard />
        </div>
      )}
    </div>
  );
}