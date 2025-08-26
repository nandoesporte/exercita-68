
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAdminExercises } from '@/hooks/useAdminExercises';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import ExerciseForm from '@/components/admin/ExerciseForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const ExerciseManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  
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
    categories
  } = useAdminExercises();

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

  const selectedExercise = selectedExerciseId 
    ? exercises.find(exercise => exercise.id === selectedExerciseId) 
    : null;

  const columns = [
    {
      accessorKey: "name",
      header: "Nome",
    },
    {
      accessorKey: "category.name",
      header: "Categoria",
      cell: ({ row }: any) => row.original.category?.name || 'Sem categoria'
    },
    {
      accessorKey: "actions",
      header: "Ações",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleEdit(row.original.id)}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            Editar
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            disabled={isDeleting}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            Excluir
          </Button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <div className="p-4 bg-destructive/20 rounded-md">
        <p className="text-destructive">Erro: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Gerenciamento de Exercícios</h1>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Criar Exercício
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={exercises} 
        isLoading={isLoading}
      />

      {/* Create Exercise Dialog - Updated with ScrollArea */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Criar Novo Exercício</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <ExerciseForm 
              onSubmit={(data) => {
                createExercise(data);
                setIsCreateDialogOpen(false);
              }}
              isLoading={isCreating}
              categories={categories}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Exercise Dialog - Updated with ScrollArea */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Editar Exercício</DialogTitle>
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
                categories={categories}
                initialData={selectedExercise}
              />
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExerciseManagement;
