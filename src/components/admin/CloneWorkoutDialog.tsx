
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CloneWorkoutDialogProps {
  workoutId: string;
  workoutTitle?: string;
  onClose: () => void;
}

export const CloneWorkoutDialog = ({ workoutId, workoutTitle, onClose }: CloneWorkoutDialogProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isCloning, setIsCloning] = useState(false);
  
  // Fetch users for selection - Fixed the query to join with auth.users to get email
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users-for-clone'],
    queryFn: async () => {
      // Instead of directly selecting email from profiles, we use a database function
      // that has proper permissions to access both profiles and auth.users tables
      const { data, error } = await supabase
        .rpc('debug_get_all_users');
      
      if (error) {
        toast.error(`Erro ao buscar usuários: ${error.message}`);
        throw new Error(`Erro ao buscar usuários: ${error.message}`);
      }
      
      return data || [];
    },
  });

  const handleCloneWorkout = async () => {
    if (!selectedUserId || !workoutId) {
      toast.error('Por favor, selecione um usuário');
      return;
    }
    
    setIsCloning(true);
    
    try {
      const { data, error } = await supabase.rpc(
        'clone_workout_for_user',
        {
          workout_id: workoutId,
          target_user_id: selectedUserId
        }
      );
      
      if (error) {
        throw error;
      }
      
      toast.success(`Treino clonado com sucesso para o usuário!`);
      onClose();
    } catch (error: any) {
      console.error('Error cloning workout:', error);
      toast.error(`Falha ao clonar treino: ${error.message}`);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Clonar Treino para Usuário</DialogTitle>
          <DialogDescription>
            {workoutTitle 
              ? `Clonar treino "${workoutTitle}" para outro usuário`
              : "Selecione um usuário para clonar este treino para sua conta"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-2">
            <label htmlFor="user-select" className="text-sm font-medium block mb-1">
              Selecionar Usuário
            </label>
            <Select
              disabled={isLoadingUsers || isCloning}
              value={selectedUserId}
              onValueChange={setSelectedUserId}
            >
              <SelectTrigger id="user-select" className="w-full">
                <SelectValue placeholder="Selecionar um usuário" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Carregando usuários...</span>
                  </div>
                ) : (
                  (users as any[])?.map(user => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <div className="bg-primary text-white rounded-full h-full w-full flex items-center justify-center text-xs">
                            {user.raw_user_meta_data?.first_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </div>
                        </Avatar>
                        <span>
                          {user.raw_user_meta_data?.first_name && user.raw_user_meta_data?.last_name 
                            ? `${user.raw_user_meta_data.first_name} ${user.raw_user_meta_data.last_name}`
                            : user.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedUserId && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm mb-2">
                <strong>Importante:</strong> Clonar irá:
              </p>
              <ul className="text-xs space-y-1">
                <li className="flex items-center">
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  Criar um novo treino na conta do usuário
                </li>
                <li className="flex items-center">
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  Copiar todos os exercícios e dias programados
                </li>
                <li className="flex items-center">
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  Adicionar como treino recomendado para o usuário
                </li>
              </ul>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCloning}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCloneWorkout}
            disabled={!selectedUserId || isCloning}
          >
            {isCloning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clonando...
              </>
            ) : (
              'Clonar Treino'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
