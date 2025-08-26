import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { format, isValid, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  first_name: z.string().min(2, {
    message: 'Nome deve ter pelo menos 2 caracteres.',
  }),
  last_name: z.string().min(2, {
    message: 'Sobrenome deve ter pelo menos 2 caracteres.',
  }),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  fitness_goal: z.string().optional(),
});

const AccountInfo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, refreshProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      birthdate: '',
      gender: '',
      weight: '',
      height: '',
      fitness_goal: '',
    },
  });
  
  // Format date to ISO format for backend
  const formatDateForBackend = (dateStr: string | undefined | null) => {
    if (!dateStr) return null;
    
    try {
      // Parse the date from DD/MM/YYYY format
      const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date());
      
      // Check if the date is valid
      if (!isValid(parsedDate)) {
        console.error('Data inválida:', dateStr);
        return null;
      }
      
      // Format date as YYYY-MM-DD for the backend
      const formattedDate = format(parsedDate, 'yyyy-MM-dd');
      console.log('Data formatada para o backend:', formattedDate);
      return formattedDate;
    } catch (error) {
      console.error('Erro ao analisar data:', error);
      return null;
    }
  };
  
  // Format date from ISO to display format
  const formatDateForDisplay = (dateStr: string | undefined | null) => {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      if (!isValid(date)) return '';
      
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };
  
  // Force refresh profile data on component mount
  useEffect(() => {
    if (user) {
      console.log('AccountInfo component mounted, forcing immediate profile refresh');
      refreshProfile();
      setFormInitialized(false); // Reset form initialization to ensure form gets updated with fresh data
    }
  }, [user, refreshProfile]);
  
  // Use effect to load profile data into form
  useEffect(() => {
    if (profile && !formInitialized) {
      console.log('Carregando dados do perfil no formulário:', profile);
      form.reset({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        birthdate: formatDateForDisplay(profile.birthdate),
        gender: profile.gender || '',
        weight: profile.weight ? String(profile.weight) : '',
        height: profile.height ? String(profile.height) : '',
        fitness_goal: profile.fitness_goal || '',
      });
      setFormInitialized(true);
    }
  }, [profile, form, formInitialized]);
  
  // Reset form initialized state when profile changes to ensure form gets updated with new data
  useEffect(() => {
    if (!profile) {
      setFormInitialized(false);
    }
  }, [profile]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast('Você precisa estar logado para salvar alterações');
      return;
    }
    
    setIsSaving(true);
    console.log('Valores do formulário para envio:', values);
    
    try {
      // Format and validate the date before sending to the backend
      const birthdate = formatDateForBackend(values.birthdate);
      console.log('Data de nascimento formatada:', birthdate);
      
      // Prepare profile data for update
      const profileData = {
        first_name: values.first_name,
        last_name: values.last_name,
        birthdate,
        gender: values.gender || null,
        weight: values.weight ? parseFloat(values.weight) : null,
        height: values.height ? parseFloat(values.height) : null,
        fitness_goal: values.fitness_goal || null,
      };
      
      console.log('Enviando atualização de perfil:', profileData);
      
      // Send update to backend
      await updateProfile(profileData);
      
      // Force a complete profile refresh after update to ensure we have the latest data
      setTimeout(() => {
        refreshProfile();
      }, 500);
      
      toast('Informações salvas com sucesso!');
      
      // Delay navigation to ensure the update is processed
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast(error.message || 'Ocorreu um erro ao salvar as informações');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-green"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Informações da Conta</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Seu nome"
                      className="bg-fitness-darkGray border-fitness-darkGray/50 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sobrenome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Seu sobrenome"
                      className="bg-fitness-darkGray border-fitness-darkGray/50 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="birthdate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de nascimento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="dd/mm/aaaa"
                      className="bg-fitness-darkGray border-fitness-darkGray/50 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gênero</FormLabel>
                  <select 
                    className="w-full rounded border bg-fitness-darkGray border-fitness-darkGray/50 p-2 text-white"
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <option value="">Selecione</option>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro</option>
                    <option value="prefer_not_to_say">Prefiro não dizer</option>
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="70"
                      className="bg-fitness-darkGray border-fitness-darkGray/50 text-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Altura (cm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="175"
                      className="bg-fitness-darkGray border-fitness-darkGray/50 text-white"
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
            name="fitness_goal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objetivo Fitness</FormLabel>
                <select 
                  className="w-full rounded border bg-fitness-darkGray border-fitness-darkGray/50 p-2 text-white"
                  value={field.value}
                  onChange={field.onChange}
                >
                  <option value="">Selecione</option>
                  <option value="lose_weight">Perder peso</option>
                  <option value="build_muscle">Ganhar massa muscular</option>
                  <option value="improve_fitness">Melhorar condicionamento</option>
                  <option value="improve_health">Melhorar a saúde geral</option>
                  <option value="maintain">Manter a forma</option>
                </select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/profile')}
              className="bg-transparent border-fitness-darkGray/50 text-white hover:bg-fitness-darkGray/30"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSaving}
              className="bg-fitness-green hover:bg-fitness-green/90 text-white"
            >
              {isSaving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </div>
              ) : 'Salvar alterações'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AccountInfo;
