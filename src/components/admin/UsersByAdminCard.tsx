import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  admin_id: string | null;
  created_at: string;
  avatar_url: string | null;
  email?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  userCount: number;
}

interface UsersByAdminCardProps {
  adminUsers: AdminUser[];
  getUsersByAdmin: (adminId?: string) => UserProfile[];
  isSuperAdmin: boolean;
}

export function UsersByAdminCard({ adminUsers, getUsersByAdmin, isSuperAdmin }: UsersByAdminCardProps) {
  const [selectedAdminId, setSelectedAdminId] = useState<string>('all');
  const [expandedAdmins, setExpandedAdmins] = useState<Set<string>>(new Set());

  const toggleAdminExpansion = (adminId: string) => {
    const newExpanded = new Set(expandedAdmins);
    if (newExpanded.has(adminId)) {
      newExpanded.delete(adminId);
    } else {
      newExpanded.add(adminId);
    }
    setExpandedAdmins(newExpanded);
  };

  const formatUserName = (user: UserProfile) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email || 'Sem nome';
  };

  const getInitials = (user: UserProfile) => {
    const name = formatUserName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isSuperAdmin) {
    // Para admins normais, mostrar apenas seus usuários
    const myUsers = getUsersByAdmin();
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Meus Usuários</CardTitle>
          </div>
          <CardDescription>
            {myUsers.length} usuário{myUsers.length !== 1 ? 's' : ''} vinculado{myUsers.length !== 1 ? 's' : ''} à sua conta
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {myUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{formatUserName(user)}</p>
                  {user.email && (
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Criado {formatDistanceToNow(new Date(user.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {myUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum usuário vinculado ainda</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Para Super Admins, mostrar interface completa com filtros
  const filteredUsers = selectedAdminId === 'all' 
    ? getUsersByAdmin() 
    : getUsersByAdmin(selectedAdminId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Usuários por Admin</CardTitle>
          </div>
          
          <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por admin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os admins</SelectItem>
              {adminUsers.map(admin => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.name} ({admin.userCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <CardDescription>
          {selectedAdminId === 'all' 
            ? `${filteredUsers.length} usuários no total`
            : `${filteredUsers.length} usuários do admin selecionado`
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {selectedAdminId === 'all' ? (
          // View agrupada por admin
          <div className="space-y-4">
            {adminUsers.map(admin => {
              const adminUsers = getUsersByAdmin(admin.id);
              const isExpanded = expandedAdmins.has(admin.id);
              
              return (
                <div key={admin.id} className="border rounded-lg">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto"
                    onClick={() => toggleAdminExpansion(admin.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {admin.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium">{admin.name}</p>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {admin.userCount} usuários
                      </Badge>
                    </div>
                    
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2">
                      {adminUsers.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-3 rounded border bg-card/30">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback className="bg-muted text-xs">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{formatUserName(user)}</p>
                            {user.email && (
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(user.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {adminUsers.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          Nenhum usuário vinculado
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // View lista simples para admin específico
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{formatUserName(user)}</p>
                  {user.email && (
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}