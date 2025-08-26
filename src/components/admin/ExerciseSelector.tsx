
import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminExercises } from '@/hooks/useAdminExercises';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ExerciseSelectorProps {
  onSelectExercise: (exerciseId: string, exerciseName: string) => void;
  onClose?: () => void;
}

export function ExerciseSelector({ onSelectExercise, onClose }: ExerciseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<any | null>(null);
  const isMobile = useIsMobile();
  
  const { exercises, categories, isLoading } = useAdminExercises();
  
  // Filter exercises based on search term and selected category
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === null || selectedCategory === 'all' || exercise.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === 'all' ? null : value);
  };

  const handlePreview = (exercise: any) => {
    setPreviewExercise(exercise);
  };

  const handleSelectAndClose = (exerciseId: string, exerciseName: string) => {
    onSelectExercise(exerciseId, exerciseName);
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Render the exercise selector content
  const renderSelectorContent = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar exercícios..."
          className="pl-9"
        />
      </div>
      
      {/* Category Selection - Tabs for desktop, Dropdown for mobile */}
      {isMobile ? (
        <Select defaultValue="all" onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecionar categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Tabs defaultValue="all" onValueChange={handleCategoryChange}>
          <TabsList className="w-full flex overflow-x-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      
      {/* Exercise List with GIF Previews */}
      <ScrollArea className={isMobile ? "h-[350px]" : "h-[450px]"}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredExercises.length > 0 ? (
           <div className={`grid ${isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"} gap-2 md:gap-3`}>
             {filteredExercises.map((exercise) => (
               <div key={exercise.id} className="border rounded-md overflow-hidden bg-card hover:border-primary transition-colors">
                 <div 
                   className="cursor-pointer"
                   onClick={() => handlePreview(exercise)}
                 >
                   <div className={`${isMobile ? "aspect-[4/3]" : "aspect-square"} relative bg-muted`}>
                     {exercise.image_url ? (
                       <img 
                         src={exercise.image_url} 
                         alt={exercise.name}
                         loading="lazy"
                         className="w-full h-full object-cover"
                       />
                     ) : (
                       <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                         Sem imagem
                       </div>
                     )}
                   </div>
                   <div className={`${isMobile ? "p-2" : "p-3"}`}>
                     <h4 className={`font-medium ${isMobile ? "text-xs" : "text-sm"} line-clamp-2 leading-tight`}>
                       {exercise.name}
                     </h4>
                     <p className={`${isMobile ? "text-xs" : "text-xs"} text-muted-foreground mt-1 line-clamp-1`}>
                       {exercise.category?.name || 'Sem categoria'}
                     </p>
                     <div className={`flex justify-center mt-2`}>
                       <Button 
                         variant="outline" 
                         size={isMobile ? "sm" : "sm"}
                         className={`${isMobile ? "text-xs px-2 py-1 h-7" : ""} w-full`}
                         onClick={(e) => {
                           e.stopPropagation();
                           handleSelectAndClose(exercise.id, exercise.name);
                         }}
                       >
                         Selecionar
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum exercício encontrado.
          </div>
        )}
      </ScrollArea>
      
      {isMobile && (
        <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
          Fechar
        </Button>
      )}
    </div>
  );

  // Preview modal for exercise details
  const renderExercisePreview = () => {
    if (!previewExercise) return null;
    
    return (
      <Dialog open={!!previewExercise} onOpenChange={(open) => !open && setPreviewExercise(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{previewExercise.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Exercise Image or Video */}
            <div className="aspect-square relative bg-muted rounded-md overflow-hidden">
              {previewExercise.video_url ? (
                <video 
                  src={previewExercise.video_url} 
                  autoPlay 
                  loop 
                  muted 
                  className="w-full h-full object-cover"
                />
              ) : previewExercise.image_url ? (
                <img 
                  src={previewExercise.image_url} 
                  alt={previewExercise.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem imagem
                </div>
              )}
            </div>
            
            {/* Exercise Details */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">Categoria</h4>
                <p className="text-sm text-muted-foreground">
                  {previewExercise.category?.name || 'Não especificada'}
                </p>
              </div>
              
              {previewExercise.description && (
                <div>
                  <h4 className="text-sm font-medium">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{previewExercise.description}</p>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setPreviewExercise(null)}
              >
                Fechar
              </Button>
              <Button 
                variant="default" 
                className="flex-1"
                onClick={() => {
                  handleSelectAndClose(previewExercise.id, previewExercise.name);
                  setPreviewExercise(null);
                }}
              >
                Selecionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Component based on device type (mobile: drawer, desktop: content)
  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="w-full">
              <Search className="mr-2 h-4 w-4" />
              Escolher Exercício
            </Button>
          </DrawerTrigger>
          <DrawerContent className="p-4 max-h-[85dvh]">
            {renderSelectorContent()}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Search className="mr-2 h-4 w-4" />
              Escolher Exercício
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Escolher Exercício</DialogTitle>
            </DialogHeader>
            {renderSelectorContent()}
          </DialogContent>
        </Dialog>
      )}
      
      {renderExercisePreview()}
    </>
  );
}
