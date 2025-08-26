
import { useState } from 'react';
import { 
  Trash2, PenSquare, ExternalLink, Star
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types/store';
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

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string, currentStatus: boolean) => Promise<void>;
}

export const ProductTable = ({ 
  products, 
  isLoading, 
  onEdit, 
  onDelete, 
  onToggleFeatured 
}: ProductTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const columns = [
    {
      accessorKey: 'image_url',
      header: 'Imagem',
      hideOnMobile: true,
      cell: ({ row }: { row: { original: any } }) => (
        <div className="h-10 w-10 rounded overflow-hidden">
          <img 
            src={row.original.image_url || '/placeholder.svg'} 
            alt={row.original.name}
            className="h-full w-full object-cover"
          />
        </div>
      )
    },
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }: { row: { original: any } }) => (
        <div className="font-medium">{row.original.name}</div>
      )
    },
    {
      accessorKey: 'price',
      header: 'Preço',
      cell: ({ row }: { row: { original: any } }) => (
        <span className="font-medium text-green-600">{formatCurrency(row.original.price)}</span>
      )
    },
    {
      accessorKey: 'categories.name',
      header: 'Categoria',
      hideOnMobile: true,
      cell: ({ row }: { row: { original: any } }) => row.original.categories?.name || 'Sem categoria'
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      hideOnMobile: true,
      cell: ({ row }: { row: { original: any } }) => (
        row.original.is_active ? 
          <Star className="h-5 w-5 text-amber-400" /> : 
          <span className="text-muted-foreground">Inativo</span>
      )
    },
    {
      accessorKey: 'is_featured',
      header: 'Destaque',
      cell: ({ row }: { row: { original: any } }) => (
        <div className="flex items-center gap-2">
          <Switch 
            checked={row.original.is_featured} 
            onCheckedChange={() => onToggleFeatured(row.original.id, row.original.is_featured)}
          />
          <span className="text-xs text-muted-foreground">
            {row.original.is_featured ? 'Destaque' : 'Normal'}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: { original: any } }) => (
        <div className="flex items-center justify-end gap-1 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="px-2"
          >
            <a href={row.original.sale_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Ver link</span>
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(row.original.id)}
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
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
      />
      
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
