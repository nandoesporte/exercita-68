
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface ProductActionsProps {
  onCreateNew: () => void;
}

export const ProductActions = ({ onCreateNew }: ProductActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 p-2 sm:p-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Gerenciamento de Produtos</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Gerencie os produtos da loja e defina quais aparecem na página inicial
        </p>
      </div>
      <Button onClick={onCreateNew} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        Criar Novo
      </Button>
    </div>
  );
};
