import { useState } from 'react';
import { 
  useAdminHealthcareProfessionals, 
  useCreateHealthcareProfessional,
  useUpdateHealthcareProfessional,
  useDeleteHealthcareProfessional
} from '@/hooks/useHealthcareProfessionals';
import { HealthcareProfessional, SPECIALTIES } from '@/types/healthcare';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProfessionalCard } from '@/components/appointments/ProfessionalCard';
import { Plus, Pencil, Trash2, Users, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ImageCropDialog } from '@/components/profile/ImageCropDialog';

export default function HealthcareProfessionalManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<HealthcareProfessional | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');

  const { data: professionals = [], isLoading } = useAdminHealthcareProfessionals();
  const createProfessional = useCreateHealthcareProfessional();
  const updateProfessional = useUpdateHealthcareProfessional();
  const deleteProfessional = useDeleteHealthcareProfessional();

  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    sub_specialty: '',
    description: '',
    photo_url: '',
    credentials: '',
    email: '',
    phone: '',
    whatsapp: '',
    experience: '',
    services: [] as string[],
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      specialty: '',
      sub_specialty: '',
      description: '',
      photo_url: '',
      credentials: '',
      email: '',
      phone: '',
      whatsapp: '',
      experience: '',
      services: [],
      is_active: true,
    });
    setEditingProfessional(null);
  };

  const handleEdit = (professional: HealthcareProfessional) => {
    setEditingProfessional(professional);
    setFormData({
      name: professional.name,
      specialty: professional.specialty,
      sub_specialty: professional.sub_specialty || '',
      description: professional.description || '',
      photo_url: professional.photo_url || '',
      credentials: professional.credentials || '',
      email: professional.email || '',
      phone: professional.phone || '',
      whatsapp: professional.whatsapp || '',
      experience: professional.experience || '',
      services: professional.services || [],
      is_active: professional.is_active,
    });
    setIsDialogOpen(true);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Create preview URL for cropping
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    setIsUploading(true);
    try {
      const fileName = `${Math.random()}.jpg`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('trainer_photos')
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('trainer_photos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
      toast.success('Foto enviada com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao enviar foto: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProfessional) {
      await updateProfessional.mutateAsync({
        id: editingProfessional.id,
        ...formData,
      });
    } else {
      await createProfessional.mutateAsync(formData as any);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteProfessional.mutateAsync(deleteId);
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-turquoise" />
          <div>
            <h1 className="text-3xl font-bold">Profissionais de Saúde</h1>
            <p className="text-muted-foreground">
              Gerencie os profissionais disponíveis para agendamento
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Profissional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProfessional ? 'Editar' : 'Adicionar'} Profissional
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do profissional de saúde
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="specialty">Especialidade *</Label>
                  <Select
                    value={formData.specialty}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, specialty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map(spec => (
                        <SelectItem key={spec.value} value={spec.value}>
                          {spec.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sub_specialty">Sub-especialidade</Label>
                  <Input
                    id="sub_specialty"
                    value={formData.sub_specialty}
                    onChange={(e) => setFormData(prev => ({ ...prev, sub_specialty: e.target.value }))}
                    placeholder="Ex: Cardiologia, Ortopedia..."
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="credentials">Credenciais</Label>
                  <Input
                    id="credentials"
                    value={formData.credentials}
                    onChange={(e) => setFormData(prev => ({ ...prev, credentials: e.target.value }))}
                    placeholder="Ex: CRM 12345, CRN 67890..."
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Breve descrição profissional..."
                    rows={3}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Foto do Profissional</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      disabled={isUploading}
                    />
                    {formData.photo_url && (
                      <img
                        src={formData.photo_url}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Você poderá ajustar e recortar a imagem após selecioná-la
                  </p>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 0000-0000"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="experience">Experiência Profissional</Label>
                  <Textarea
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="Descreva a experiência profissional, formação acadêmica, áreas de atuação..."
                    rows={4}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="services">Serviços Oferecidos</Label>
                  <Textarea
                    id="services"
                    value={formData.services.join('\n')}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      services: e.target.value.split('\n').filter(s => s.trim()) 
                    }))}
                    placeholder="Digite um serviço por linha, ex:&#10;Consulta de Nutrição&#10;Avaliação Física&#10;Prescrição de Treino"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite um serviço por linha
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createProfessional.isPending || updateProfessional.isPending}>
                  {editingProfessional ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {professionals.map((professional) => (
            <Card key={professional.id} className="p-6">
              <ProfessionalCard professional={professional} />
              
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(professional)}
                  className="gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(professional.id)}
                  className="gap-2 text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={imageToCrop}
        onCropComplete={handleCroppedImage}
        aspectRatio={1}
        cropShape="rect"
      />
    </div>
  );
}
