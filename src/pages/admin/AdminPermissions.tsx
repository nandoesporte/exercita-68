import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPermissionsCard } from '@/components/admin/AdminPermissionsCard';
import { UsersByAdminCard } from '@/components/admin/UsersByAdminCard';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { useUsersByAdmin } from '@/hooks/useUsersByAdmin';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Shield, Users, Settings, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';

export default function AdminPermissions() {
  const { isSuperAdmin, isLoading: isLoadingRole } = useAdminRole();
  const { adminsWithPermissions, isLoading: isLoadingPermissions, togglePermission, isUpdating } = useAdminPermissions();
  const { adminUsers, getUsersByAdmin, getUnassignedUsers, getMyAssignedUsers, adminData, isSuperAdmin: isSuperAdminFromUsers, isAdmin } = useUsersByAdmin();
  const [expandedAdmins, setExpandedAdmins] = useState<Record<string, boolean>>({});

  if (isLoadingRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperAdmin && !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Permissões e Isolamento
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSuperAdmin 
              ? "Gerencie permissões dos administradores e visualize usuários por admin"
              : "Visualize seus usuários e permissões ativas"
            }
          </p>
        </div>
      </div>

      {/* Cards de estatísticas - apenas para Super Admin */}
      {isSuperAdmin && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores Ativos</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminsWithPermissions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Administradores com acesso ao sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Totais</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getUsersByAdmin().length}</div>
              <p className="text-xs text-muted-foreground">
                Usuários registrados no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permissões Ativas</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {adminsWithPermissions?.reduce((total, admin) => total + admin.permissions.length, 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total de permissões concedidas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões dos Admins
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários por Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-6">
          {isSuperAdmin ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Gerenciar Permissões dos Administradores
                  </CardTitle>
                  <CardDescription>
                    Configure as permissões de cada administrador para controlar o acesso às funcionalidades do sistema.
                    Cada admin só terá acesso aos recursos marcados abaixo.
                  </CardDescription>
                </CardHeader>
              </Card>

              {isLoadingPermissions ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </CardContent>
                </Card>
              ) : adminsWithPermissions && adminsWithPermissions.length > 0 ? (
                <div className="space-y-4">
                  {adminsWithPermissions.map(admin => {
                    const isExpanded = expandedAdmins[admin.id] || false;
                    
                    return (
                      <Collapsible 
                        key={admin.id} 
                        open={isExpanded} 
                        onOpenChange={(open) => 
                          setExpandedAdmins(prev => ({
                            ...prev,
                            [admin.id]: open
                          }))
                        }
                      >
                        <Card>
                          <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-primary font-semibold">
                                      {admin.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">{admin.name}</CardTitle>
                                    <CardDescription className="text-sm">{admin.email}</CardDescription>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="text-xs">
                                    {admin.permissions.length} permissões
                                  </Badge>
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <AdminPermissionsCard
                                admin={admin}
                                onTogglePermission={togglePermission}
                                isUpdating={isUpdating}
                              />
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum administrador encontrado</h3>
                    <p className="text-muted-foreground">
                      Ainda não há administradores ativos no sistema para gerenciar permissões.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Suas Permissões Ativas
                </CardTitle>
                <CardDescription>
                  Estas são as funcionalidades que você tem acesso no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Para visualizar suas permissões, entre em contato com o Super Administrador.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UsersByAdminCard
            adminUsers={adminUsers}
            getUsersByAdmin={getUsersByAdmin}
            getUnassignedUsers={getUnassignedUsers}
            getMyAssignedUsers={getMyAssignedUsers}
            adminData={adminData}
            isSuperAdmin={isSuperAdminFromUsers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}