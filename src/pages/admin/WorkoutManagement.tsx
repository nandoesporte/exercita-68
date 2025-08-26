import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Trash2, PenSquare, Dumbbell, Users
} from 'lucide-react';
import { useAdminWorkouts } from '@/hooks/useAdminWorkouts';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CloneWorkoutDialog } from '@/components/admin/CloneWorkoutDialog';
import { DataTable } from '@/components/ui/data-table';

const WorkoutManagement = () => {
  const navigate = useNavigate();
  const { workouts, isLoading, deleteWorkout } = useAdminWorkouts();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cloneWorkoutId, setCloneWorkoutId] = useState<string | null>(null);
  
  const filteredWorkouts = workouts.filter(workout => 
    workout.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    navigate('/admin/workouts/create');
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/workouts/${id}/edit`);
  };

  const handleEditExercises = (id: string) => {
    navigate(`/admin/workouts/${id}/exercises`);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteWorkout(deleteId);
      setDeleteId(null);
    }
  };

  const handleOpenCloneDialog = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCloneWorkoutId(id);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Gerenciamento de Treinos</h1>
        <Button onClick={handleCreateNew} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Buscar treinos..." 
          className="pl-10 text-sm sm:text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <DataTable
        columns={[
          {
            accessorKey: "title",
            header: "Título",
            cell: ({ row }: { row: { original: any } }) => (
              <span className="font-medium">{row.original.title}</span>
            )
          },
          {
            accessorKey: "level",
            header: "Nível", 
            cell: ({ row }: { row: { original: any } }) => (
              <span className="capitalize">{row.original.level}</span>
            )
          },
          {
            accessorKey: "duration",
            header: "Duração",
            cell: ({ row }: { row: { original: any } }) => (
              <span>{row.original.duration} min</span>
            )
          },
          {
            accessorKey: "category",
            header: "Categoria",
            hideOnMobile: true,
            cell: ({ row }: { row: { original: any } }) => (
              <span>{row.original.category?.name || 'Sem categoria'}</span>
            )
          },
          {
            accessorKey: "actions",
            header: "Ações",
            cell: ({ row }: { row: { original: any } }) => (
               <div className="flex items-center justify-end gap-1 flex-wrap">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={(e) => handleOpenCloneDialog(row.original.id, e)}
                   title="Clonar para usuário"
                   className="px-2"
                 >
                   <Users className="h-4 w-4" />
                   <span className="sr-only">Clonar para Usuário</span>
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleEditExercises(row.original.id)}
                   className="px-2"
                 >
                   <Dumbbell className="h-4 w-4" />
                   <span className="sr-only">Editar Exercícios</span>
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleEdit(row.original.id)}
                   className="px-2"
                 >
                   <PenSquare className="h-4 w-4" />
                   <span className="sr-only">Editar</span>
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => handleDeleteClick(row.original.id)}
                   className="px-2"
                 >
                   <Trash2 className="h-4 w-4" />
                   <span className="sr-only">Excluir</span>
                 </Button>
               </div>
             )
           }
        ]}
        data={filteredWorkouts}
        isLoading={isLoading}
      />

      {filteredWorkouts.length === 0 && !isLoading && (
        <div className="p-6 sm:p-8 text-center">
          <p className="text-muted-foreground text-sm sm:text-base">Nenhum treino encontrado</p>
          <Button variant="link" onClick={handleCreateNew} className="text-sm sm:text-base">
            Crie seu primeiro treino
          </Button>
        </div>
      )}
      
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="w-[95vw] sm:max-w-lg p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              treino selecionado e todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {cloneWorkoutId && (
        <CloneWorkoutDialog
          workoutId={cloneWorkoutId}
          workoutTitle={filteredWorkouts.find(w => w.id === cloneWorkoutId)?.title}
          onClose={() => setCloneWorkoutId(null)}
        />
      )}
    </div>
  );
};

export default WorkoutManagement;