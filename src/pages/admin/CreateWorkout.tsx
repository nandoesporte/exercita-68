
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAdminWorkouts, WorkoutFormData } from '@/hooks/useAdminWorkouts';
import WorkoutForm from '@/components/admin/WorkoutForm';
import { toast } from '@/lib/toast-wrapper';
import { AdminDataRefresh } from '@/components/admin/AdminDataRefresh';

const CreateWorkout = () => {
  const navigate = useNavigate();
  const { 
    createWorkout, 
    isCreating, 
    categories, 
    areCategoriesLoading,
    users,
    areUsersLoading
  } = useAdminWorkouts();
  
  const handleCreateWorkout = (data: WorkoutFormData) => {
    if (data.days_of_week && data.days_of_week.length === 0) {
      toast('Considere selecionar dias da semana para o cronograma de treinos');
    }
    
    createWorkout(data, {
      onSuccess: () => {
        toast.success('Treino criado com sucesso!');
        navigate('/admin/workouts');
      },
      onError: (error) => {
        console.error("Erro ao criar treino:", error);
        toast.error(`Erro ao criar treino: ${error.message}`);
      }
    });
  };

  const isLoading = isCreating || areCategoriesLoading || areUsersLoading;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/workouts')}
            className="p-2 hover:bg-muted rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Criar Novo Treino</h1>
        </div>
        <AdminDataRefresh />
      </div>
      
      <div className="bg-card rounded-lg border border-border p-6">
        {isLoading && !categories.length ? (
          <div className="py-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <WorkoutForm 
            onSubmit={handleCreateWorkout} 
            isLoading={isCreating}
            categories={categories}
            users={users}
          />
        )}
      </div>
    </div>
  );
};

export default CreateWorkout;
