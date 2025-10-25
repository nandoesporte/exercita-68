import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Apple, TrendingUp, Settings, Pencil, Trash2 } from 'lucide-react';
import { GOAL_LABELS, ACTIVITY_LABELS, Goal, ActivityLevel, Gender } from '@/types/nutrition';
import { toast } from 'sonner';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface NutritionProfile {
  id: string;
  user_id: string;
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  goal: Goal;
  activity_level: ActivityLevel;
  bmi?: number;
  bmr?: number;
  daily_calories?: number;
  daily_protein?: number;
  daily_carbs?: number;
  daily_fats?: number;
  profiles?: User;
}

export default function NutritionPlanManagement() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<NutritionProfile | null>(null);
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: '' as Gender,
    goal: '' as Goal,
    activityLevel: '' as ActivityLevel,
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users-for-nutrition'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name');

      if (error) throw error;
      return data as User[];
    },
  });

  const { data: nutritionProfiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['nutrition-profiles-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user details separately
      const userIds = data.map(p => p.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Merge user data with nutrition profiles
      const profilesWithUsers = data.map(profile => ({
        ...profile,
        user: usersData?.find(u => u.id === profile.user_id),
      }));

      return profilesWithUsers as (NutritionProfile & { user?: User })[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('nutrition_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-profiles-admin'] });
      toast.success('Plano nutricional excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir plano: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('nutrition_profiles')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-profiles-admin'] });
      toast.success('Plano nutricional atualizado com sucesso!');
      setEditDialogOpen(false);
      setEditingProfile(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar plano: ' + error.message);
    },
  });

  const handleEdit = (profile: NutritionProfile & { user?: User }) => {
    setEditingProfile(profile);
    setFormData({
      weight: profile.weight.toString(),
      height: profile.height.toString(),
      age: profile.age.toString(),
      gender: profile.gender,
      goal: profile.goal,
      activityLevel: profile.activity_level,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile) return;

    try {
      // Calculate new metrics
      const { data: metrics, error: metricsError } = await supabase.functions.invoke(
        'calculate-nutrition-metrics',
        {
          body: {
            weight: parseFloat(formData.weight),
            height: parseFloat(formData.height),
            age: parseInt(formData.age),
            gender: formData.gender,
            activityLevel: formData.activityLevel,
            goal: formData.goal,
          },
        }
      );

      if (metricsError) throw metricsError;

      await updateMutation.mutateAsync({
        id: editingProfile.id,
        data: {
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          age: parseInt(formData.age),
          gender: formData.gender,
          goal: formData.goal,
          activity_level: formData.activityLevel,
          bmi: metrics.bmi,
          bmr: metrics.bmr,
          daily_calories: metrics.daily_calories,
          daily_protein: metrics.daily_protein,
          daily_carbs: metrics.daily_carbs,
          daily_fats: metrics.daily_fats,
        },
      });
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  };

  const handleCreateProfile = async () => {
    if (!selectedUser) {
      toast.error('Selecione um usuário');
      return;
    }

    try {
      toast.loading('Criando plano nutricional...');

      // Calculate metrics
      const { data: metrics, error: metricsError } = await supabase.functions.invoke(
        'calculate-nutrition-metrics',
        {
          body: {
            weight: parseFloat(formData.weight),
            height: parseFloat(formData.height),
            age: parseInt(formData.age),
            gender: formData.gender,
            activityLevel: formData.activityLevel,
            goal: formData.goal,
          },
        }
      );

      if (metricsError) throw metricsError;

      // Create profile
      const { data: newProfile, error: profileError } = await supabase
        .from('nutrition_profiles')
        .insert([{
          user_id: selectedUser,
          weight: parseFloat(formData.weight),
          height: parseFloat(formData.height),
          age: parseInt(formData.age),
          gender: formData.gender,
          goal: formData.goal,
          activity_level: formData.activityLevel,
          bmi: metrics.bmi,
          bmr: metrics.bmr,
          daily_calories: metrics.daily_calories,
          daily_protein: metrics.daily_protein,
          daily_carbs: metrics.daily_carbs,
          daily_fats: metrics.daily_fats,
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // Generate default meal plan
      const { data: mealPlanData, error: mealPlanError } = await supabase.functions.invoke(
        'generate-meal-plan',
        {
          body: {
            user_profile: {
              peso_kg: parseFloat(formData.weight),
              altura_cm: parseFloat(formData.height),
              idade: parseInt(formData.age),
              sexo: formData.gender === 'masculino' ? 'M' : 'F',
              atividade_fisica: formData.activityLevel,
              objetivo: formData.goal,
            },
            calorias_alvo: metrics.daily_calories,
            macros: {
              proteina: { gramas: metrics.daily_protein, percentual: 30 },
              carboidrato: { gramas: metrics.daily_carbs, percentual: 40 },
              gordura: { gramas: metrics.daily_fats, percentual: 30 },
            },
            restricoes: [],
            preferencias: [],
            refeicoes_por_dia: 4,
          },
        }
      );

      if (!mealPlanError && mealPlanData?.success) {
        toast.success('Plano nutricional e modelo padrão criados com sucesso!');
      } else {
        toast.success('Plano nutricional criado! (Modelo padrão pendente)');
      }

      queryClient.invalidateQueries({ queryKey: ['nutrition-profiles-admin'] });
      setDialogOpen(false);
      setSelectedUser('');
      setFormData({
        weight: '',
        height: '',
        age: '',
        gender: '' as Gender,
        goal: '' as Goal,
        activityLevel: '' as ActivityLevel,
      });
    } catch (error: any) {
      toast.error('Erro ao criar plano: ' + error.message);
    } finally {
      toast.dismiss();
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' };
    if (bmi < 25) return { label: 'Peso normal', color: 'text-green-500' };
    if (bmi < 30) return { label: 'Sobrepeso', color: 'text-yellow-500' };
    return { label: 'Obesidade', color: 'text-red-500' };
  };

  const isFormValid = 
    formData.weight && 
    formData.height && 
    formData.age && 
    formData.gender && 
    formData.goal && 
    formData.activityLevel;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Planos Nutricionais</h1>
          <p className="text-muted-foreground">Crie e gerencie planos nutricionais personalizados para seus alunos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Criar Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Plano Nutricional</DialogTitle>
              <DialogDescription>
                Configure o perfil nutricional personalizado para o aluno
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Seleção de Usuário */}
              <div>
                <Label>Selecionar Aluno</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dados Básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="70"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    placeholder="170"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Sexo</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value as Gender })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Objetivo */}
              <div>
                <Label>Objetivo</Label>
                <Select value={formData.goal} onValueChange={(value) => setFormData({ ...formData, goal: value as Goal })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GOAL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nível de Atividade */}
              <div>
                <Label>Nível de Atividade Física</Label>
                <Select
                  value={formData.activityLevel}
                  onValueChange={(value) => setFormData({ ...formData, activityLevel: value as ActivityLevel })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreateProfile} disabled={!isFormValid || !selectedUser} className="w-full">
                Criar Plano Nutricional
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Planos Existentes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingProfiles ? (
          <div className="col-span-full flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : nutritionProfiles && nutritionProfiles.length > 0 ? (
          nutritionProfiles.map((profile) => {
            const user = profile.user;
            const bmiCategory = profile.bmi ? getBMICategory(profile.bmi) : null;

            return (
              <Card key={profile.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {user?.first_name} {user?.last_name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {GOAL_LABELS[profile.goal]}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{ACTIVITY_LABELS[profile.activity_level]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">IMC</p>
                      <p className="text-lg font-bold">{profile.bmi?.toFixed(1)}</p>
                      {bmiCategory && (
                        <p className={`text-xs ${bmiCategory.color}`}>{bmiCategory.label}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Meta Diária</p>
                      <p className="text-lg font-bold">{profile.daily_calories}</p>
                      <p className="text-xs text-muted-foreground">calorias</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Proteína:</span>
                      <span className="font-medium">{profile.daily_protein}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Carboidratos:</span>
                      <span className="font-medium">{profile.daily_carbs}g</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gorduras:</span>
                      <span className="font-medium">{profile.daily_fats}g</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(profile)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este plano nutricional? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(profile.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Apple className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum plano nutricional criado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie o primeiro plano nutricional para seus alunos
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Criar Novo Plano
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plano Nutricional</DialogTitle>
            <DialogDescription>
              Atualize as informações do perfil nutricional do aluno
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Dados Básicos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-weight">Peso (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-height">Altura (cm)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-age">Idade</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-gender">Sexo</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value as Gender })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Objetivo</Label>
              <Select value={formData.goal} onValueChange={(value) => setFormData({ ...formData, goal: value as Goal })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nível de Atividade Física</Label>
              <Select
                value={formData.activityLevel}
                onValueChange={(value) => setFormData({ ...formData, activityLevel: value as ActivityLevel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingProfile(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateProfile}
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
