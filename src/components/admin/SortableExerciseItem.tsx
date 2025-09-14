import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowUp, ArrowDown, Trash2, Edit, Weight, ZoomIn, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageViewerModal from '@/components/ImageViewerModal';

interface SortableExerciseItemProps {
  exercise: {
    id: string;
    name?: string;
    category?: { name?: string; } | null;
    description?: string;
    image_url?: string;
    is_title_section?: boolean;
    section_title?: string | null;
    [key: string]: any;
  };
  index: number;
  totalCount: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMoveUp?: (id: string, position: number) => void;
  onMoveDown?: (id: string, position: number) => void;
  onRemove?: (id: string) => void;
}

const SortableExerciseItem: React.FC<SortableExerciseItemProps> = ({
  exercise,
  index,
  totalCount,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Helper to format duration in a readable way
  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined || seconds === 0) return null;
    
    if (seconds >= 60 && seconds % 60 === 0) {
      return `${seconds / 60} min`;
    }
    return `${seconds} seg`;
  };

  const handleDelete = onDelete || onRemove;
  
  const openImageViewer = (url: string, alt: string) => {
    setSelectedImage({ url, alt });
  };

  // Handle section title items
  if (exercise.is_title_section) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className={`border rounded-lg p-4 bg-primary/10 ${isDragging ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 hover:bg-primary/20 rounded-md touch-manipulation select-none"
              style={{ touchAction: 'none' }}
            >
              <GripVertical className="h-5 w-5 text-primary" />
            </div>
            <div className="bg-primary/20 text-primary font-medium rounded-full w-6 h-6 flex items-center justify-center">
              {index + 1}
            </div>
            <h3 className="font-medium flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="font-semibold">{exercise.section_title || "Seção"}</span>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">Título</span>
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {onMoveUp && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveUp(exercise.id, index + 1)}
                disabled={index === 0}
                className="h-8 w-8"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
            {onMoveDown && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveDown(exercise.id, index + 1)}
                disabled={index === totalCount - 1}
                className="h-8 w-8"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
            {handleDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(exercise.id)}
                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Handle both direct exercise objects and nested exercise objects
  const exerciseData = exercise.exercise || exercise;
  const imageUrl = exerciseData.image_url || exercise.image_url;
  const categoryName = exerciseData.category?.name || 
                      (exercise.category && exercise.category.name);
  const exerciseName = exercise.name || (exercise.exercise && exercise.exercise.name) || "Exercício desconhecido";
  
  return (
    <>
      <div 
        ref={setNodeRef}
        style={style}
        className={`border rounded-lg p-4 bg-background ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md touch-manipulation select-none"
              style={{ touchAction: 'none' }}
            >
              <GripVertical className="h-5 w-5 text-primary" />
            </div>
            <div className="bg-primary/20 text-primary font-medium rounded-full w-6 h-6 flex items-center justify-center">
              {index + 1}
            </div>
            <h3 className="font-medium">{exerciseName}</h3>
          </div>
          <div className="flex items-center gap-1">
            {onMoveUp && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveUp(exercise.id, index + 1)}
                disabled={index === 0}
                className="h-8 w-8"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
            {onMoveDown && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMoveDown(exercise.id, index + 1)}
                disabled={index === totalCount - 1}
                className="h-8 w-8"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(exercise.id)}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {handleDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(exercise.id)}
                className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Preview image/gif - Clickable now */}
        {imageUrl && (
          <div className="mb-3 aspect-video overflow-hidden rounded-md bg-muted relative group">
            <img 
              src={imageUrl} 
              alt={exerciseName} 
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => openImageViewer(imageUrl, exerciseName)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Button 
                variant="secondary" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => openImageViewer(imageUrl, exerciseName)}
              >
                <ZoomIn className="h-4 w-4 mr-1" />
                <span>Ampliar</span>
              </Button>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {(exercise.description || (exercise.exercise && exercise.exercise.description)) && (
            <div className="break-words">
              <span className="text-muted-foreground font-medium">Descrição:</span> 
              <span className="text-foreground ml-1 break-words">{exercise.description || (exercise.exercise && exercise.exercise.description)}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {categoryName && (
              <div className="break-words">
                <span className="text-muted-foreground font-medium">Categoria:</span> 
                <span className="ml-1 text-foreground">{categoryName}</span>
              </div>
            )}
            
            {exercise.sets && (
              <div>
                <span className="font-semibold text-foreground">Séries:</span> 
                <span className="font-medium text-muted-foreground ml-1">{exercise.sets}</span>
              </div>
            )}
            
            {exercise.reps && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-semibold text-foreground">Repetições:</span> 
                <span className="font-medium text-muted-foreground">{exercise.reps}</span>
                {exercise.weight && exercise.weight > 0 && (
                  <span className="flex items-center gap-0.5 bg-muted px-2 py-0.5 rounded-full text-xs font-medium text-foreground">
                    <Weight className="h-3 w-3 text-primary" />
                    {exercise.weight}kg
                  </span>
                )}
              </div>
            )}
            
            {exercise.duration !== undefined && exercise.duration !== null && exercise.duration > 0 && (
              <div>
                <span className="font-semibold text-foreground">Duração:</span> 
                <span className="font-medium text-muted-foreground ml-1">{formatDuration(exercise.duration) || 'Não especificada'}</span>
              </div>
            )}
            
            {exercise.rest !== undefined && exercise.rest !== null && (
              <div>
                <span className="font-semibold text-foreground">Descanso:</span> 
                <span className="font-medium text-muted-foreground ml-1">{
                  exercise.rest >= 60 && exercise.rest % 60 === 0
                    ? `${exercise.rest / 60} min`
                    : `${exercise.rest} seg`
                }</span>
              </div>
            )}
            
            {exercise.weight && !exercise.reps && (
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">Peso:</span> 
                <span className="flex items-center gap-1 font-medium text-muted-foreground">
                  <Weight className="h-4 w-4 text-primary" />
                  {exercise.weight}kg
                </span>
              </div>
            )}
            
            {exercise.day_of_week && (
              <div className="break-words">
                <span className="font-semibold text-foreground">Dia:</span> 
                <span className="font-medium text-muted-foreground ml-1">{exercise.day_of_week}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewerModal 
          imageUrl={selectedImage.url} 
          altText={selectedImage.alt}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  );
};

export default SortableExerciseItem;