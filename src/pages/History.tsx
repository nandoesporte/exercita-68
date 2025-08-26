
import React from 'react';
import { History as HistoryIcon, Calendar, Clock, Dumbbell, Star, Flame, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWorkoutHistory, WorkoutHistoryItem } from '@/hooks/useWorkoutHistory';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';

interface GroupedWorkouts {
  [monthYear: string]: WorkoutHistoryItem[];
}

const History = () => {
  const { data: workoutHistory, isLoading, error, refetch } = useWorkoutHistory();
  const [workoutToDelete, setWorkoutToDelete] = React.useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-orange"></div>
      </div>
    );
  }

  if (error) {
    console.error("Workout history error:", error);
    return (
      <div className="container p-4 text-center">
        <p className="text-red-500">Erro ao carregar histórico. Tente novamente mais tarde.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Group workouts by month
  const groupedByMonth: GroupedWorkouts = workoutHistory?.reduce((acc: GroupedWorkouts, workout) => {
    if (!workout.completed_at) {
      console.warn("Workout missing completed_at:", workout);
      return acc;
    }
    
    try {
      const date = new Date(workout.completed_at);
      const monthYear = format(date, 'MMMM yyyy', { locale: ptBR });
      
      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }
      
      acc[monthYear].push(workout);
    } catch (err) {
      console.error("Error formatting date for workout:", workout, err);
    }
    return acc;
  }, {}) || {};

  const handleDeleteWorkout = async () => {
    if (!workoutToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('user_workout_history')
        .delete()
        .eq('id', workoutToDelete);
      
      if (error) {
        throw error;
      }
      
      toast.success('Treino excluído com sucesso');
      
      refetch();
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
      toast.error('Erro ao excluir registro de treino');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setWorkoutToDelete(null);
    }
  };

  const formatWorkoutLevel = (level: string) => {
    const levels: Record<string, string> = {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
    };
    
    return levels[level] || level;
  };

  const renderEmptyState = () => (
    <div className="text-center py-10">
      <HistoryIcon className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
      <h3 className="mt-4 font-semibold text-xl">Sem registros de treino</h3>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Quando você concluir treinos, eles aparecerão aqui com detalhes como duração, 
        calorias queimadas e sua avaliação.
      </p>
      <Link
        to="/workouts"
        className="mt-4 inline-block px-4 py-2 bg-fitness-orange hover:bg-fitness-orange/90 text-white rounded-md transition"
      >
        Explorar Treinos
      </Link>
    </div>
  );

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-fitness-orange">Meu Histórico de Treinos</h2>
      </div>
      
      {!workoutHistory || workoutHistory.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByMonth).map(([month, workouts]) => (
            <div key={month} className="space-y-3">
              <h3 className="text-lg font-medium text-fitness-orange capitalize">{month}</h3>
              
              {workouts.map((workout) => (
                <div 
                  key={workout.id} 
                  className="p-4 border border-fitness-darkGray/40 rounded-lg bg-fitness-darkGray/20 backdrop-blur-sm hover:bg-fitness-darkGray/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">
                      {workout.completed_at ? format(new Date(workout.completed_at), 'dd/MM/yyyy') : 'Data desconhecida'}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      {workout.rating && (
                        <div className="flex items-center gap-1 text-fitness-orange">
                          <Star size={16} fill="currentColor" />
                          <span className="text-sm">{workout.rating}/5</span>
                        </div>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        onClick={() => {
                          setWorkoutToDelete(workout.id);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 size={16} />
                        <span className="sr-only">Excluir treino</span>
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg">{workout.workout?.title || 'Treino sem título'}</h3>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock size={14} className="text-fitness-orange" />
                      <span>{workout.duration || (workout.workout && workout.workout.duration) || 0} min</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Dumbbell size={14} className="text-fitness-orange" />
                      <span>{workout.workout && workout.workout.level ? formatWorkoutLevel(workout.workout.level) : 'Nível desconhecido'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Flame size={14} className="text-fitness-orange" />
                      <span>{workout.calories_burned || (workout.workout && workout.workout.calories) || 0} kcal</span>
                    </div>
                  </div>
                  
                  {workout.notes && (
                    <div className="mt-3 text-sm text-muted-foreground border-t border-fitness-darkGray/30 pt-2">
                      <p className="line-clamp-2">{workout.notes}</p>
                    </div>
                  )}
                  
                  {workout.workout?.category && (
                    <div className="mt-3 flex">
                      <span 
                        className="text-xs px-2 py-1 rounded-full" 
                        style={{ 
                          backgroundColor: `${workout.workout.category.color}30`,
                          color: workout.workout.category.color 
                        }}
                      >
                        {workout.workout.category.name}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-fitness-darkGray/90 backdrop-blur-md border border-fitness-darkGray">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de treino?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkout}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export default History;
