
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAdminWorkouts, WorkoutFormData } from '@/hooks/useAdminWorkouts';
import { useWorkout } from '@/hooks/useWorkouts';
import WorkoutForm from '@/components/admin/WorkoutForm';
import { toast } from '@/lib/toast-wrapper';

const EditWorkout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workout, isLoading: isWorkoutLoading } = useWorkout(id);
  const { 
    categories, 
    areCategoriesLoading, 
    users, 
    areUsersLoading,
    updateWorkout,
    isUpdating,
    getWorkoutDays,
  } = useAdminWorkouts();
  
  const { data: workoutDays = [] } = getWorkoutDays(id || '');
  const [defaultValues, setDefaultValues] = useState<WorkoutFormData | null>(null);

  useEffect(() => {
    if (workout && workoutDays) {
      setDefaultValues({
        title: workout.title,
        description: workout.description || '',
        duration: workout.duration,
        level: workout.level,
        category_id: workout.category_id || null,
        calories: workout.calories || null,
        days_of_week: workoutDays,
      });
    }
  }, [workout, workoutDays]);

  const handleBackClick = () => {
    navigate('/admin/workouts');
  };

  const handleSubmit = (data: WorkoutFormData) => {
    if (!id) return;
    
    updateWorkout({
      id,
      ...data
    });
  };

  const isLoading = isWorkoutLoading || areCategoriesLoading || areUsersLoading;

  if (isLoading && !defaultValues) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={handleBackClick}
          className="p-2 hover:bg-muted rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Editar Treino</h1>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        {defaultValues && (
          <WorkoutForm 
            onSubmit={handleSubmit} 
            isLoading={isUpdating}
            categories={categories}
            users={users}
            defaultValues={defaultValues}
            isEditing={true}
          />
        )}
      </div>
    </div>
  );
};

export default EditWorkout;
