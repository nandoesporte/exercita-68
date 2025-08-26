
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Copy, Users } from 'lucide-react';
import { useAdminWorkouts, WorkoutExercise } from '@/hooks/useAdminWorkouts';
import { useWorkout } from '@/hooks/useWorkouts';
import ExerciseList from '@/components/admin/ExerciseList';
import AddExerciseForm from '@/components/admin/AddExerciseForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import { CloneWorkoutDialog } from '@/components/admin/CloneWorkoutDialog';

// Define the days of week options
const daysOfWeek = [
  { id: 'all', label: 'Todos os dias' },
  { id: 'monday', label: 'Segunda' },
  { id: 'tuesday', label: 'Terça' },
  { id: 'wednesday', label: 'Quarta' },
  { id: 'thursday', label: 'Quinta' },
  { id: 'friday', label: 'Sexta' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' },
];

const EditWorkoutExercises = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workout, isLoading: isWorkoutLoading } = useWorkout(id);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [targetDays, setTargetDays] = useState<string[]>([]);
  const [isCloneUserDialogOpen, setIsCloneUserDialogOpen] = useState(false);
  
  const { 
    exercises,
    areExercisesLoading,
    getWorkoutExercises,
    addExerciseToWorkout,
    isAddingExercise,
    removeExerciseFromWorkout,
    isRemovingExercise,
    updateExerciseOrder,
    isUpdatingExerciseOrder,
    cloneExercisesToDays,
    isCloningExercises,
  } = useAdminWorkouts();

  const { 
    data: workoutExercises = [], 
    isLoading: areWorkoutExercisesLoading 
  } = getWorkoutExercises(id || '', selectedDayOfWeek);

  const handleBackClick = () => {
    navigate('/admin/workouts');
  };

  const handleAddExercise = (exerciseData: WorkoutExercise) => {
    if (!id) return;
    
    addExerciseToWorkout({
      workoutId: id,
      exerciseData
    });
  };

  const handleRemoveExercise = (exerciseId: string) => {
    if (!id) return;
    
    removeExerciseFromWorkout({
      exerciseId,
      workoutId: id
    });
  };

  const handleMoveUp = (exerciseId: string, currentPosition: number) => {
    if (!id || currentPosition <= 1) return;
    
    updateExerciseOrder({
      exerciseId,
      newPosition: currentPosition - 1,
      workoutId: id
    });
  };

  const handleMoveDown = (exerciseId: string, currentPosition: number) => {
    if (!id || currentPosition >= workoutExercises.length) return;
    
    updateExerciseOrder({
      exerciseId,
      newPosition: currentPosition + 1,
      workoutId: id
    });
  };

  const handleDayChange = (day: string) => {
    setSelectedDayOfWeek(day === 'all' ? null : day);
  };

  const handleOpenCloneDialog = () => {
    if (!selectedDayOfWeek) {
      toast.error("Selecione um dia específico para clonar os exercícios");
      return;
    }
    
    setTargetDays([]);
    setIsCloneDialogOpen(true);
  };

  const handleCloneExercises = async () => {
    if (!id || !selectedDayOfWeek || targetDays.length === 0) return;
    
    try {
      await cloneExercisesToDays({
        workoutId: id,
        sourceDayOfWeek: selectedDayOfWeek,
        targetDaysOfWeek: targetDays
      });
      
      setIsCloneDialogOpen(false);
      toast.success(`Exercícios clonados com sucesso para ${targetDays.length} dia(s)`);
    } catch (error) {
      console.error("Error cloning exercises:", error);
      toast.error("Erro ao clonar exercícios");
    }
  };

  const handleOpenCloneUserDialog = () => {
    setIsCloneUserDialogOpen(true);
  };

  const isLoading = isWorkoutLoading || areExercisesLoading || areWorkoutExercisesLoading;
  const isActionLoading = isAddingExercise || isRemovingExercise || isUpdatingExerciseOrder || isCloningExercises;

  // Filter out the current day and "all" option for cloning targets
  const availableTargetDays = daysOfWeek.filter(day => 
    day.id !== 'all' && day.id !== selectedDayOfWeek
  );

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 px-2 sm:px-4 lg:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={handleBackClick}
            className="p-2 hover:bg-muted rounded-full flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1 sm:flex-none">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">
              Editar Exercícios do Treino
            </h1>
            {workout && (
              <span className="text-sm sm:text-base text-muted-foreground block mt-1 sm:inline sm:mt-0 sm:ml-2 truncate">
                - {workout.title}
              </span>
            )}
          </div>
        </div>
        
        {/* Clone to User button at top right */}
        {id && (
          <Button 
            onClick={handleOpenCloneUserDialog} 
            variant="outline"
            className="flex items-center gap-1"
          >
            <Users className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Clonar para Usuário</span>
            <span className="md:hidden">Clonar</span>
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="py-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <>
          {/* Day of Week Filter with Clone Button */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <h2 className="font-medium">Filtrar por dia</h2>
              </div>
              {selectedDayOfWeek && selectedDayOfWeek !== 'all' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleOpenCloneDialog}
                  disabled={!selectedDayOfWeek || selectedDayOfWeek === 'all'}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  <span>Clonar para outros dias</span>
                </Button>
              )}
            </div>
            
            {/* Mobile: Select dropdown, Desktop: Tabs */}
            {isMobile ? (
              <Select defaultValue="all" onValueChange={handleDayChange}>
                <SelectTrigger className="w-full bg-card text-card-foreground">
                  <SelectValue placeholder="Selecionar dia" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.id} value={day.id}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Tabs defaultValue="all" onValueChange={handleDayChange}>
                <TabsList className="grid grid-cols-4 md:grid-cols-8">
                  {daysOfWeek.map((day) => (
                    <TabsTrigger key={day.id} value={day.id}>
                      {day.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-10">
            <div className="bg-card rounded-lg border border-border p-3 sm:p-4 lg:p-6 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Lista de Exercícios</h2>
              <div className="overflow-hidden">
                <ExerciseList 
                  exercises={workoutExercises}
                  onRemove={handleRemoveExercise}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  isLoading={areWorkoutExercisesLoading}
                />
              </div>
            </div>
            
            <div className="bg-card rounded-lg border border-border p-3 sm:p-4 lg:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Adicionar Exercício</h2>
              <AddExerciseForm 
                exercises={exercises}
                onAddExercise={handleAddExercise}
                currentExerciseCount={workoutExercises.length}
                isLoading={isActionLoading}
              />
            </div>
          </div>

          {/* Clone Dialog */}
          <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clonar exercícios para outros dias</DialogTitle>
                <DialogDescription>
                  Selecione os dias para onde deseja clonar os exercícios de {daysOfWeek.find(day => day.id === selectedDayOfWeek)?.label || selectedDayOfWeek}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 gap-4 py-4">
                <div className="space-y-3">
                  {availableTargetDays.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`day-${day.id}`}
                        checked={targetDays.includes(day.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTargetDays([...targetDays, day.id]);
                          } else {
                            setTargetDays(targetDays.filter(d => d !== day.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={`day-${day.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCloneDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCloneExercises} 
                  disabled={targetDays.length === 0 || isCloningExercises}
                >
                  {isCloningExercises ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                      Clonando...
                    </>
                  ) : (
                    'Clonar Exercícios'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Clone to User Dialog */}
          {isCloneUserDialogOpen && id && (
            <CloneWorkoutDialog 
              workoutId={id}
              workoutTitle={workout?.title}
              onClose={() => setIsCloneUserDialogOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default EditWorkoutExercises;
