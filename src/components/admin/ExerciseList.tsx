
import React from 'react';
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
import SortableExerciseItem from './SortableExerciseItem';

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
    [key: string]: any; // Allow for additional properties
  }>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMoveUp?: (id: string, position: number) => void;
  onMoveDown?: (id: string, position: number) => void;
  onRemove?: (id: string) => void;
  onReorder?: (exercises: Array<any>) => void;
  isLoading: boolean;
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
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
};

export default ExerciseList;
