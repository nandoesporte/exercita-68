
import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Trash2, Edit, Weight, Calendar, FileText, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageViewerModal from '@/components/ImageViewerModal';

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
  isLoading: boolean;
}

const ExerciseList: React.FC<ExerciseListProps> = ({
  exercises,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onRemove,
  isLoading,
}) => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

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

  return (
    <div className="space-y-3">
      {exercises.map((exercise, index) => {
        // Handle section title items
        if (exercise.is_title_section) {
          return (
            <div 
              key={exercise.id}
              className="border rounded-lg p-4 bg-primary/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
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
                      disabled={index === exercises.length - 1}
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
          <div 
            key={exercise.id}
            className="border rounded-lg p-4 bg-background"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
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
                    disabled={index === exercises.length - 1}
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
        );
      })}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewerModal 
          imageUrl={selectedImage.url} 
          altText={selectedImage.alt}
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

export default ExerciseList;
