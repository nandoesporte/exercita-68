
import React, { useState } from 'react';
import { useAdminExercises } from '@/hooks/useAdminExercises';
import { useExerciseCategories } from '@/hooks/useExerciseCategories';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExerciseFilter } from '@/components/admin/ExerciseFilter';
import { ExerciseBatchUpload } from '@/components/admin/ExerciseBatchUpload';
import ExerciseList from '@/components/admin/ExerciseList';
import ExerciseForm from '@/components/admin/ExerciseForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Upload, Dumbbell } from 'lucide-react';
import { toast } from '@/lib/toast-wrapper';

export default function ExerciseLibrary() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { 
    exercises, 
    isLoading, 
    error, 
    createExercise, 
    isCreating, 
    updateExercise,
    isUpdating,
    deleteExercise,
    isDeleting,
    batchCreateExercises
  } = useAdminExercises();

  const { categories, createDefaultCategories } = useExerciseCategories();

  const selectedExercise = selectedExerciseId 
    ? exercises.find(exercise => exercise.id === selectedExerciseId) 
    : null;
  
  const filteredExercises = exercises.filter(exercise => {
    // Filter by category if active tab is not "all"
    if (activeTab !== "all" && exercise.category?.id !== activeTab) {
      return false;
    }
    
    // Filter by search term if one is provided
    if (searchTerm && !exercise.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedExerciseId(id);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este exercício?')) {
      deleteExercise(id);
    }
  };

  const handleBatchUpload = () => {
    setIsBatchUploadOpen(true);
  };
  
  const handleBatchSubmit = async (data: any) => {
    try {
      // We'll directly use the validated data without additional processing
      await batchCreateExercises(data);
      setIsBatchUploadOpen(false);
      toast.success("Exercícios importados com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao importar exercícios: ${error.message}`);
    }
  };

  // Use the actual categories from database query
  const exerciseCategories = categories;

  if (error) {
    return (
      <div className="p-4 bg-destructive/20 rounded-md">
        <p className="text-destructive">Erro: {error.message}</p>
      </div>
    );
  }

  // Show a helpful message if no categories exist
  if (categories.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Biblioteca de Exercícios</h1>
        </div>
        <div className="text-center py-12">
          <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-muted-foreground mb-6">
            Você precisa criar categorias antes de adicionar exercícios. 
            Clique no botão abaixo para criar as categorias padrão.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => createDefaultCategories()} className="gap-2">
              <Dumbbell className="h-4 w-4" />
              Criar Categorias Padrão
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/admin/exercises/categories'}>
              Gerenciar Categorias
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Biblioteca de Exercícios</h1>
        <div className="flex gap-2">
          <Button onClick={handleBatchUpload} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload em Lote
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Exercício
          </Button>
        </div>
      </div>
      
      <ExerciseFilter 
        categories={exerciseCategories}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {exerciseCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          <ExerciseList 
            exercises={filteredExercises}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

      {/* Create Exercise Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Criar Novo Exercício</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <ExerciseForm 
              onSubmit={(data) => {
                createExercise(data);
                setIsCreateDialogOpen(false);
              }}
              isLoading={isCreating}
              categories={exerciseCategories}
              preSelectedCategory={selectedCategory}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Exercise Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Exercício</DialogTitle>
          </DialogHeader>
          {selectedExercise && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <ExerciseForm 
                onSubmit={(data) => {
                  updateExercise({
                    id: selectedExercise.id,
                    ...data
                  });
                  setIsEditDialogOpen(false);
                }}
                isLoading={isUpdating}
                categories={exerciseCategories}
                initialData={selectedExercise}
              />
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Batch Upload Dialog */}
      <Dialog open={isBatchUploadOpen} onOpenChange={setIsBatchUploadOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Upload em Lote de Exercícios</DialogTitle>
            <DialogDescription>
              Faça upload de múltiplas imagens para criar exercícios em lote. Você deve selecionar uma categoria válida.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <ExerciseBatchUpload 
              onSubmit={handleBatchSubmit} 
              categories={categories}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
