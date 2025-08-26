import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AVAILABLE_PERMISSIONS } from "@/hooks/useAdminPermissions";
import type { Database } from '@/integrations/supabase/types';

type UserPermission = Database['public']['Enums']['user_permission'];

interface AdminWithPermissions {
  id: string;
  name: string;
  email: string;
  permissions: UserPermission[];
}

interface AdminPermissionsCardProps {
  admin: AdminWithPermissions;
  onTogglePermission: (adminId: string, permission: UserPermission, hasPermission: boolean) => void;
  isUpdating: boolean;
}

export function AdminPermissionsCard({ admin, onTogglePermission, isUpdating }: AdminPermissionsCardProps) {
  // Group permissions by category
  const permissionsByCategory = Object.entries(AVAILABLE_PERMISSIONS).reduce((acc, [permission, config]) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push({ permission: permission as UserPermission, ...config });
    return acc;
  }, {} as Record<string, Array<{ permission: UserPermission; label: string; description: string; category: string }>>);

  const hasPermission = (permission: UserPermission) => admin.permissions.includes(permission);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {admin.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{admin.name}</CardTitle>
            <CardDescription className="text-sm">{admin.email}</CardDescription>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="text-xs">
              {admin.permissions.length} permissões ativas
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {Object.entries(permissionsByCategory).map(([category, permissions]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
              <Separator className="flex-1" />
            </div>
            
            <div className="grid gap-3">
              {permissions.map(({ permission, label, description }) => {
                const isEnabled = hasPermission(permission);
                
                return (
                  <div key={permission} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex-1">
                      <Label 
                        htmlFor={`${admin.id}-${permission}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    </div>
                    
                    <Switch
                      id={`${admin.id}-${permission}`}
                      checked={isEnabled}
                      onCheckedChange={(checked) => onTogglePermission(admin.id, permission, !checked)}
                      disabled={isUpdating}
                      className="ml-3"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}