
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductFormData } from "@/types/store";
import { ProductCategory } from "@/types/store";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ListPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const formSchema = z.object({
  name: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  price: z.coerce.number().positive("O preço deve ser positivo"),
  image_url: z.string().url("Deve ser uma URL válida").or(z.literal("")),
  sale_url: z.string().url("Deve ser uma URL válida para direcionamento do cliente").or(z.literal("")),
  category_id: z.string().nullable(),
  is_active: z.boolean().default(false),
  is_featured: z.boolean().default(false)
});

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  isLoading: boolean;
  defaultValues?: ProductFormData;
  categories: ProductCategory[];
  isEditing?: boolean;
}

const ProductForm = ({
  onSubmit,
  isLoading,
  defaultValues,
  categories,
  isEditing = false,
}: ProductFormProps) => {
  console.log('ProductForm rendering with defaultValues:', defaultValues);
  console.log('Categories available:', categories);
  
  const navigate = useNavigate();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      price: 0,
      image_url: "",
      sale_url: "",
      category_id: null,
      is_active: false,
      is_featured: false
    },
  });

  useEffect(() => {
    if (defaultValues) {
      console.log('Setting form values from defaultValues:', defaultValues);
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const handleSubmit = (values: ProductFormData) => {
    console.log("Form submitting with values:", values);
    onSubmit(values);
  };
  
  const handleNavigateToCategories = () => {
    navigate("/admin/categories");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome do Produto */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Produto</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do produto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preço */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (R$)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* URL da Imagem */}
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL da Imagem</FormLabel>
                <FormControl>
                  <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* URL de Venda */}
          <FormField
            control={form.control}
            name="sale_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Venda (Link de redirecionamento)</FormLabel>
                <FormControl>
                  <Input placeholder="https://exemplo.com/pagina-de-venda" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categoria */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between">
                  <span>Categoria</span>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={handleNavigateToCategories}
                    className="h-8 px-2 text-xs"
                  >
                    <ListPlus className="mr-1 h-4 w-4" />
                    Gerenciar Categorias
                  </Button>
                </FormLabel>
                <Select
                  value={field.value || undefined}
                  onValueChange={(value) => field.onChange(value || null)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">Nenhuma categoria</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.color ? (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        ) : (
                          category.name
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* É Ativo */}
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Produto Ativo</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Marque esta opção para tornar este produto visível na loja.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* É Destaque */}
          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0 rounded-md border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Produto em Destaque</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Marque para exibir este produto no carrossel da página inicial.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Descrição (span 2 colunas) */}
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Produto</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o produto em detalhes..." 
                      className="min-h-[120px] resize-y"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-fitness-green hover:bg-fitness-green/80"
          >
            {isLoading ? 
              "Salvando..." : 
              isEditing ? "Atualizar Produto" : "Criar Produto"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
