import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, Save } from 'lucide-react';

type UserData = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
};

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
}

export function EditUserDialog({ isOpen, onClose, user }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        password: '',
      });
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('Usuário não selecionado');

      const updateData: any = {};
      
      // Só incluir campos que foram modificados e não estão vazios
      if (data.first_name && data.first_name !== user.first_name) {
        updateData.p_first_name = data.first_name;
      }
      if (data.last_name && data.last_name !== user.last_name) {
        updateData.p_last_name = data.last_name;
      }
      if (data.email && data.email !== user.email) {
        updateData.p_email = data.email;
      }
      if (data.password && data.password.length >= 6) {
        updateData.p_password = data.password;
      }

      // Se nenhum campo foi alterado, não fazer nada
      if (Object.keys(updateData).length === 0) {
        throw new Error('Nenhuma alteração foi feita');
      }

      const { data: result, error } = await supabase.rpc('admin_update_user', {
        target_user_id: user.id,
        ...updateData,
      });

      if (error) throw new Error(error.message);
      
      const resultObj = result as any;
      if (!resultObj?.success) {
        throw new Error(resultObj?.message || 'Erro ao atualizar usuário');
      }

      return resultObj;
    },
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      onClose();
      setFormData({ first_name: '', last_name: '', email: '', password: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.first_name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    updateUserMutation.mutate(formData);
  };

  const handleClose = () => {
    onClose();
    setFormData({ first_name: '', last_name: '', email: '', password: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription>
            Edite os dados do usuário. Deixe a senha em branco para não alterar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Nome do usuário"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Sobrenome do usuário"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Nova Senha (opcional)
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Deixe em branco para não alterar"
              minLength={6}
            />
            {formData.password && formData.password.length < 6 && (
              <p className="text-sm text-destructive">Senha deve ter pelo menos 6 caracteres</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateUserMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}