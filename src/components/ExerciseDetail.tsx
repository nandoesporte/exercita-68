
import React, { useState } from 'react';
import { ArrowLeft, Clock, Dumbbell, Scale, ZoomIn, Weight } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ImageViewerModal from '@/components/ImageViewerModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Exercise = Database['public']['Tables']['exercises']['Row'];
type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'] & {
  exercise?: Exercise | null;
  is_title_section?: boolean;
  section_title?: string | null;
};

interface ExerciseDetailProps {
  workoutExercise: WorkoutExercise;
  onBack: () => void;
}

const ExerciseDetail = ({ workoutExercise, onBack }: ExerciseDetailProps) => {
  // If this is a title section or has no exercise data, go back
  if (workoutExercise.is_title_section || !workoutExercise.exercise) {
    onBack();
    return null;
  }
  
  const [viewImage, setViewImage] = useState<boolean>(false);
  const { exercise, sets, reps, duration, rest, weight } = workoutExercise;
  const isMobile = useIsMobile();
  const { profile } = useProfile();
  
  // Helper function for profile avatar
  const getInitials = () => {
    if (!profile) return 'U';
    
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };
  
  // Helper function to format duration
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds || seconds === 0) return null;
    
    // If duration is a multiple of 60, display in minutes
    if (seconds % 60 === 0 && seconds >= 60) {
      return {
        value: seconds / 60,
        unit: 'min'
      };
    }
    
    // Otherwise display in seconds
    return {
      value: seconds,
      unit: 'seg'
    };
  };
  
  const formattedDuration = formatDuration(duration);
  const showWeight = weight !== null && weight !== undefined && weight > 0;
  const showReps = reps !== null && reps !== undefined && reps > 0;
  const showRest = rest !== null && rest !== undefined && rest > 0;
  
  return (
    <>
      {/* Custom header for workout detail pages */}
      <header className="sticky top-0 z-40 w-full bg-fitness-dark/95 backdrop-blur-lg border-b border-fitness-darkGray/50">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* Back button */}
            <button 
              onClick={onBack} 
              className="p-2 rounded-full hover:bg-fitness-darkGray/60 active:scale-95 transition-all"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M19 12H5M5 12L12 19M5 12L12 5" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          
          {/* App Logo for Mobile (centered) */}
          <div className={`absolute left-1/2 transform -translate-x-1/2 flex items-center ${!isMobile && 'hidden'}`}>
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/abe8bbb7-7e2f-4277-b5b0-1f923e57b6f7.png"
                alt="Mais Saúde Logo"
                className="h-10 w-10"
              />
              <span className="font-extrabold text-xl text-white">Mais Saúde</span>
            </Link>
          </div>

          {/* App Logo for Desktop (left aligned) */}
          {!isMobile && (
            <div className="flex-1 flex justify-center">
              <Link to="/" className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/abe8bbb7-7e2f-4277-b5b0-1f923e57b6f7.png"
                  alt="Mais Saúde Logo"
                  className="h-10 w-10"
                />
                <span className="font-extrabold text-xl text-white">Mais Saúde</span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-4">
            {/* Profile Icon */}
            <Link 
              to="/profile" 
              className="p-1 rounded-full hover:bg-fitness-darkGray/60 active:scale-95 transition-all"
            >
              <Avatar className="h-8 w-8 border-2 border-fitness-green">
                <AvatarImage 
                  src={profile?.avatar_url || ''} 
                  alt={`${profile?.first_name || 'Usuário'}'s profile`} 
                />
                <AvatarFallback className="bg-fitness-dark text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="container pb-6">
        {/* Hero Image - Now clickable */}
        <div className="relative h-64 md:h-80">
          <img
            src={exercise.image_url || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=750&q=80'}
            alt={exercise.name}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => exercise.image_url && setViewImage(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
            <h1 className="text-fitness-orange text-2xl md:text-3xl font-bold">{exercise.name}</h1>
            {exercise.image_url && (
              <Button 
                variant="secondary" 
                size="sm" 
                className="mt-2 w-auto"
                onClick={() => setViewImage(true)}
              >
                <ZoomIn className="h-4 w-4 mr-1" />
                <span>Ampliar imagem</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Exercise Details */}
        <div className="mt-6 space-y-6">
          {/* Exercise Instructions */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-fitness-orange">Instruções</h2>
            <p className="text-muted-foreground">
              {exercise.description || 'Nenhuma instrução disponível para este exercício.'}
            </p>
          </div>
          
          {/* Exercise Parameters */}
          <div>
            <h2 className="text-lg font-semibold mb-3 text-fitness-orange">Parâmetros</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Dumbbell size={16} className="text-fitness-orange" />
                  <span className="text-sm font-medium">Séries</span>
                </div>
                <p className="text-xl font-bold text-white">{sets}</p>
              </div>
              
              {showReps ? (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Dumbbell size={16} className="text-fitness-orange" />
                    <span className="text-sm font-medium">Repetições</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-white">{reps}</p>
                    {showWeight && (
                      <span className="flex items-center gap-1 bg-fitness-darkGray/30 px-2 py-1 rounded-full text-sm font-medium text-white">
                        <Weight className="h-3 w-3 text-fitness-orange" />
                        {weight}kg
                      </span>
                    )}
                  </div>
                </div>
              ) : formattedDuration ? (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock size={16} className="text-fitness-orange" />
                    <span className="text-sm font-medium">Duração</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {formattedDuration.value} {formattedDuration.unit}
                    {formattedDuration.unit === 'min' && (
                      <span className="text-sm font-normal ml-1 text-muted-foreground">
                        ({formattedDuration.value * 60} segundos)
                      </span>
                    )}
                  </p>
                </div>
              ) : null}
              
              {/* Only show rest if greater than 0 */}
              {showRest && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock size={16} className="text-fitness-orange" />
                    <span className="text-sm font-medium">Descanso</span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xl font-bold text-white">
                          {rest >= 60 && rest % 60 === 0 
                            ? `${rest / 60} min` 
                            : `${rest} seg`}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        {rest >= 60 
                          ? `${rest} segundos` 
                          : ''}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              
              {/* Weight parameter block - only if weight > 0 */}
              {showWeight && (
                <div className="p-4 border rounded-lg bg-fitness-darkGray/5">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Weight size={16} className="text-fitness-orange" />
                    <span className="text-sm font-medium">Carga</span>
                  </div>
                  <p className="text-xl font-bold text-white flex items-center">
                    {weight} <span className="ml-1">kg</span>
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Video if available */}
          {exercise.video_url && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-fitness-orange">Guia em Vídeo</h2>
              <div className="aspect-video rounded-lg overflow-hidden">
                <iframe 
                  src={exercise.video_url} 
                  className="w-full h-full"
                  title={`${exercise.name} guia em vídeo`}
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
          
          {/* Back button */}
          <div className="pt-4">
            <button
              onClick={onBack}
              className="fitness-btn-secondary w-full flex items-center justify-center gap-2 py-3"
            >
              <ArrowLeft size={18} />
              <span>Voltar para Lista de Exercícios</span>
            </button>
          </div>
        </div>
      </main>
      
      {/* Image Viewer Modal */}
      {exercise.image_url && (
        <ImageViewerModal
          imageUrl={exercise.image_url}
          altText={exercise.name}
          isOpen={viewImage}
          onClose={() => setViewImage(false)}
        />
      )}
    </>
  );
};

export default ExerciseDetail;
