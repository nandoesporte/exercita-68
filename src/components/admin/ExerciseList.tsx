
import React, { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SortableExerciseItem from './SortableExerciseItem';

// Days mapping in Portuguese
const weekdaysMapping: Record<string, string> = {
  "monday": "Segunda-feira",
  "tuesday": "Terça-feira",
  "wednesday": "Quarta-feira", 
  "thursday": "Quinta-feira",
  "friday": "Sexta-feira",
  "saturday": "Sábado",
  "sunday": "Domingo",
  "all_days": "Todos os dias"
};

// Create a more flexible type that can handle both AdminExercise and WorkoutExercise
interface ExerciseListProps {
  exercises: Array<{
    id: string;
    name?: string;
    category?: { name?: string; } | null;
    description?: string;
    image_url?: string;
    is_title_section?: boolean;
    section_title?: string | null;
    day_of_week?: string | null;
    [key: string]: any; // Allow for additional properties
  }>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMoveUp?: (id: string, position: number) => void;
  onMoveDown?: (id: string, position: number) => void;
  onRemove?: (id: string) => void;
  onReorder?: (exercises: Array<any>) => void;
  isLoading: boolean;
  showByDay?: boolean;
}

const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRemove,
  onReorder,
  isLoading,
  showByDay = false,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group exercises by day of week when showByDay is true
  const exercisesByDay = useMemo(() => {
    if (!showByDay) {
      return { 'all': exercises };
    }

    const grouped: Record<string, typeof exercises> = {};
    
    exercises.forEach(exercise => {
      const day = exercise.day_of_week || 'all_days';
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(exercise);
    });

    // Sort exercises within each day by order_position if available
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => {
        const posA = (a as any).order_position || 0;
        const posB = (b as any).order_position || 0;
        return posA - posB;
      });
    });

    return grouped;
  }, [exercises, showByDay]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum exercício adicionado ainda. Utilize o formulário para adicionar exercícios.
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = exercises.findIndex((item) => item.id === active.id);
      const newIndex = exercises.findIndex((item) => item.id === over?.id);

      const newExercises = arrayMove(exercises, oldIndex, newIndex);
      
      // Call onReorder if provided
      if (onReorder) {
        onReorder(newExercises);
      }
    }
  };

  // If not showing by day, render normal list
  if (!showByDay) {
    return (
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={exercises.map(ex => ex.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <SortableExerciseItem
                key={exercise.id}
                exercise={exercise}
                index={index}
                totalCount={exercises.length}
                onEdit={onEdit}
                onDelete={onDelete}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onRemove={onRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  // Render exercises grouped by day
  const sortedDays = Object.keys(exercisesByDay).sort((a, b) => {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'all_days'];
    return dayOrder.indexOf(a) - dayOrder.indexOf(b);
  });

  return (
    <div className="space-y-6">
      {sortedDays.map(day => {
        const dayExercises = exercisesByDay[day];
        if (!dayExercises.length) return null;

        return (
          <div key={day} className="space-y-3">
            {/* Day header */}
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">
                {weekdaysMapping[day] || day}
              </h3>
              <Badge variant="outline" className="text-xs">
                {dayExercises.length} exercício{dayExercises.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Exercises for this day */}
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={dayExercises.map(ex => ex.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 pl-4">
                  {dayExercises.map((exercise, index) => (
                    <SortableExerciseItem
                      key={exercise.id}
                      exercise={exercise}
                      index={exercises.findIndex(ex => ex.id === exercise.id)}
                      totalCount={exercises.length}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onMoveUp={onMoveUp}
                      onMoveDown={onMoveDown}
                      onRemove={onRemove}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        );
      })}
    </div>
  );
};

export default ExerciseList;
