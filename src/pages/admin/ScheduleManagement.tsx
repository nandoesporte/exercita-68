import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';

// Schema for the form validation
const trainerFormSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  credentials: z.string().min(3, { message: 'Credenciais são obrigatórias' }),
  bio: z.string().min(10, { message: 'Bio deve ter pelo menos 10 caracteres' }),
  whatsapp: z.string().regex(/^\d+$/, { message: 'Apenas números são permitidos' }),
});

type TrainerFormValues = z.infer<typeof trainerFormSchema>;

const ScheduleManagement = () => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const { 
    trainer, 
    isLoading, 
    updateTrainer, 
    isUpdating, 
    uploadPhoto, 
    isUploading, 
    photoUrl: uploadedPhotoUrl 
  } = usePersonalTrainer();

  // Create form
  const form = useForm<TrainerFormValues>({
    resolver: zodResolver(trainerFormSchema),
    defaultValues: {
      name: '',
      credentials: '',
      bio: '',
      whatsapp: '',
    },
  });

  // Populate form when trainer data loads
  useEffect(() => {
    if (trainer) {
      form.setValue('name', trainer.name || '');
      form.setValue('credentials', trainer.credentials || '');
      form.setValue('bio', trainer.bio || '');
      form.setValue('whatsapp', trainer.whatsapp || '');
      setPhotoUrl(trainer.photo_url);
    }
  }, [trainer, form]);

  // Update photoUrl when new photo is uploaded
  useEffect(() => {
    if (uploadedPhotoUrl) {
      setPhotoUrl(uploadedPhotoUrl);
    }
  }, [uploadedPhotoUrl]);

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    uploadPhoto(file);
  };

  // Handle form submission
  const onSubmit = async (data: TrainerFormValues) => {
    updateTrainer({
      name: data.name || '',
      credentials: data.credentials,
      bio: data.bio,
      whatsapp: data.whatsapp,
      photo_url: photoUrl,
    });
  };

  return (
    <div className="container max-w-4xl py-6 px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Gerenciar Página de Agendamento</h1>

      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl">Informações do Personal Trainer</CardTitle>
          <CardDescription className="text-sm">
            Atualize as informações e foto do personal trainer que aparecem na página de agendamento
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <div className="space-y-6">
            {/* Photo Upload Section - Mobile Optimized */}
            <div className="space-y-3">
              <Label htmlFor="photo-upload" className="text-sm font-medium">Foto do Perfil</Label>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-muted relative flex-shrink-0">
                  {photoUrl ? (
                    <img 
                      src={photoUrl} 
                      alt="Foto do perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs sm:text-sm text-center p-2">
                      Sem foto
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    className="relative w-full sm:w-auto" 
                    disabled={isUploading}
                    size="sm"
                  >
                    <input 
                      id="photo-upload"
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handlePhotoUpload}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar nova foto
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center sm:text-left">
                    Formatos: JPG, PNG. Máx: 2MB
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Grid Layout for better mobile experience */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Nome</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Nome do Personal Trainer" 
                              className="text-base"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="credentials"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Credenciais</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Personal Trainer - CREF 123456" 
                              className="text-base"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">WhatsApp</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Apenas números, ex: 44997270698" 
                            type="tel"
                            className="text-base"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Biografia</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição curta sobre o personal trainer..." 
                            className="min-h-[80px] md:min-h-20 text-base resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-fitness-green to-fitness-blue mt-6"
                    disabled={isUpdating}
                    size="lg"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Informações'
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Mobile bottom padding for navigation */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};

export default ScheduleManagement;
