import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Users, Crown } from 'lucide-react';
import { useUsersByAdmin } from '@/hooks/useUsersByAdmin';
import { useAdminPermissionsContext } from '@/hooks/useAdminPermissionsContext';

interface AdminFilterProps {
  selectedAdminId: string | null;
  onAdminChange: (adminId: string | null) => void;
}

export function AdminFilter({ selectedAdminId, onAdminChange }: AdminFilterProps) {
  const { adminUsers } = useUsersByAdmin();
  const { isSuperAdmin } = useAdminPermissionsContext();

  // Only show filter for Super Admin
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown className="h-5 w-5" />
          Filtro por Administrador
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedAdminId || "all"}
            onValueChange={(value) => onAdminChange(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Selecione um administrador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Todos os Administradores
                </div>
              </SelectItem>
              {adminUsers.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{admin.name}</span>
                    <span className="text-muted-foreground">({admin.userCount} usuários)</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Como Super Admin, você pode visualizar dados de todos os administradores ou filtrar por um específico.
        </p>
      </CardContent>
    </Card>
  );
}