import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const AdminDataRefresh: React.FC = () => {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    // Invalidate all admin-related queries
    queryClient.invalidateQueries({ queryKey: ['admin-workout-categories'] });
    queryClient.invalidateQueries({ queryKey: ['users-by-admin'] });
    queryClient.invalidateQueries({ queryKey: ['current-admin-id'] });
    queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
    queryClient.invalidateQueries({ queryKey: ['admin-workouts'] });
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
    
    toast.success('Dados atualizados!');
  };

  return (
    <Button 
      onClick={handleRefresh}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Atualizar Dados
    </Button>
  );
};