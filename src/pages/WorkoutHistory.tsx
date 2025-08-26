
import React from 'react';
import { ArrowLeft, Calendar, Clock, Dumbbell, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory';

const WorkoutHistory = () => {
  const { data: history, isLoading } = useWorkoutHistory();
  
  // Group workouts by month for the list view
  const groupWorkoutsByMonth = () => {
    if (!history) return {};
    
    const grouped: Record<string, typeof history> = {};
    
    history.forEach((workout) => {
      if (!workout.completed_at) {
        console.warn("Workout missing completed_at:", workout);
        return;
      }
      
      try {
        const workoutDate = parseISO(workout.completed_at);
        const monthKey = format(workoutDate, 'yyyy-MM');
        
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        
        grouped[monthKey].push(workout);
      } catch (error) {
        console.error("Invalid date format:", workout.completed_at, error);
      }
    });
    
    return grouped;
  };
  
  const groupedWorkouts = groupWorkoutsByMonth();
  const monthKeys = Object.keys(groupedWorkouts).sort((a, b) => (a > b ? -1 : 1)); // Sort newest first

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-orange"></div>
      </div>
    );
  }

  return (
    <main className="container">
      <section className="mobile-section">
        <div className="mb-6 flex items-center">
          <Link to="/profile" className="mr-2">
            <ArrowLeft className="text-fitness-orange" />
          </Link>
          <h1 className="text-2xl font-bold">Histórico de Treinos</h1>
        </div>
        
        {/* Workout History List */}
        <div className="space-y-6">
          {history && history.length > 0 ? (
            monthKeys.map((monthKey) => {
              const monthDate = parseISO(`${monthKey}-01`);
              
              return (
                <div key={monthKey} className="space-y-3">
                  <h3 className="text-lg font-medium">
                    {format(monthDate, 'MMMM yyyy', { locale: ptBR })}
                  </h3>
                  
                  <div className="space-y-3">
                    {groupedWorkouts[monthKey].map((workout) => {
                      if (!workout.completed_at) {
                        return null;
                      }
                      
                      try {
                        const workoutDate = parseISO(workout.completed_at);
                        
                        return (
                          <Link
                            to={`/workout/${workout.workout_id}`}
                            key={workout.id}
                            className="block bg-fitness-darkGray p-4 rounded-lg"
                          >
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-semibold">{workout.workout?.title || 'Treino Personalizado'}</h4>
                                <div className="flex items-center text-sm text-gray-400 mt-1">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  <span>{format(workoutDate, 'dd/MM/yyyy')}</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end">
                                <div className="flex items-center text-sm">
                                  <Flame className="h-4 w-4 text-fitness-orange mr-1" />
                                  <span>{workout.calories_burned || '0'} kcal</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-400 mt-1">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{workout.duration || '0'} min</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      } catch (error) {
                        console.error("Failed to render workout:", workout.id, error);
                        return null;
                      }
                    }).filter(Boolean)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-fitness-darkGray p-6 rounded-lg text-center">
              <Dumbbell className="h-12 w-12 text-fitness-orange mx-auto mb-3" />
              <p className="font-semibold">Nenhum treino concluído ainda</p>
              <p className="text-sm text-gray-400 mt-1">
                Complete um treino para começar a registrar seu histórico
              </p>
              <Link
                to="/workouts"
                className="mt-4 inline-block px-4 py-2 bg-fitness-orange hover:bg-fitness-orange/90 text-white rounded-md transition"
              >
                Explorar Treinos
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default WorkoutHistory;
