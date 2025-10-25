import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNutritionProfile } from '@/hooks/useNutritionProfile';
import { GOAL_LABELS, ACTIVITY_LABELS, Goal, ActivityLevel, Gender } from '@/types/nutrition';
import { Loader2, ChevronLeft, ChevronRight, User, Target, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OnboardingProps {
  onComplete: () => void;
}

export const NutritionOnboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(1);
  const { calculateMetrics, createProfile } = useNutritionProfile();

  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: '' as Gender,
    allergies: [] as string[],
    restrictions: [] as string[],
    goal: '' as Goal,
    activityLevel: '' as ActivityLevel,
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [restrictionInput, setRestrictionInput] = useState('');

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      updateField('allergies', [...formData.allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    updateField('allergies', formData.allergies.filter((_, i) => i !== index));
  };

  const addRestriction = () => {
    if (restrictionInput.trim()) {
      updateField('restrictions', [...formData.restrictions, restrictionInput.trim()]);
      setRestrictionInput('');
    }
  };

  const removeRestriction = (index: number) => {
    updateField('restrictions', formData.restrictions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const metrics = await calculateMetrics.mutateAsync({
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        age: parseInt(formData.age),
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        goal: formData.goal,
      });

      // Mapear os dados retornados pela IA para os campos do banco
      await createProfile.mutateAsync({
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        age: parseInt(formData.age),
        gender: formData.gender,
        allergies: formData.allergies,
        restrictions: formData.restrictions,
        goal: formData.goal,
        activity_level: formData.activityLevel,
        bmi: metrics.imc,
        bmr: metrics.tmb,
        daily_calories: metrics.calorias_alvo,
        daily_protein: metrics.macros.proteina.gramas,
        daily_carbs: metrics.macros.carboidrato.gramas,
        daily_fats: metrics.macros.gordura.gramas,
      });

      toast.success('Perfil criado com sucesso!');

      // Gerar plano de refeições padrão
      try {
        // Verificar se há sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('Nenhuma sessão ativa encontrada');
          toast.error('Perfil salvo, mas é necessário estar autenticado para gerar o plano');
          onComplete();
          return;
        }

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
              calorias_alvo: metrics.calorias_alvo,
              macros: {
                proteina: { gramas: metrics.macros.proteina.gramas, percentual: metrics.macros.proteina.percentual },
                carboidrato: { gramas: metrics.macros.carboidrato.gramas, percentual: metrics.macros.carboidrato.percentual },
                gordura: { gramas: metrics.macros.gordura.gramas, percentual: metrics.macros.gordura.percentual },
              },
              restricoes: formData.restrictions,
              preferencias: [],
              refeicoes_por_dia: 4,
            },
          }
        );

        if (mealPlanError) {
          console.error('Erro ao gerar plano:', mealPlanError);
          toast.error('Perfil salvo mas houve um erro ao criar plano nutricional');
        } else {
          toast.success('Plano nutricional criado com sucesso!');
        }
      } catch (planError) {
        console.error('Erro ao gerar plano:', planError);
        toast.error('Perfil salvo mas houve um erro ao criar plano nutricional');
      }

      // Chamar onComplete para indicar que o processo foi concluído
      onComplete();
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
      toast.error('Erro ao criar perfil nutricional');
    }
  };

  const isStep1Valid = formData.weight && formData.height && formData.age && formData.gender;
  const isStep2Valid = formData.goal && formData.activityLevel;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  s === step ? 'bg-primary' : s < step ? 'bg-primary/50' : 'bg-muted'
                )}
              />
            ))}
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && 'Dados Pessoais'}
            {step === 2 && 'Objetivos e Atividade'}
            {step === 3 && 'Alergias e Restrições'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Preencha suas informações básicas'}
            {step === 2 && 'Defina seus objetivos nutricionais'}
            {step === 3 && 'Informe suas restrições alimentares (opcional)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Informações Básicas</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    placeholder="70"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateField('height', e.target.value)}
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
                    onChange={(e) => updateField('age', e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Sexo</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
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
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Objetivo Nutricional</h3>
              </div>
              <div>
                <Label>Qual é seu objetivo?</Label>
                <Select value={formData.goal} onValueChange={(value) => updateField('goal', value as Goal)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu objetivo" />
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

              <div className="flex items-center gap-2 mt-6 mb-4">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Nível de Atividade</h3>
              </div>
              <div>
                <Label>Qual seu nível de atividade física?</Label>
                <Select
                  value={formData.activityLevel}
                  onValueChange={(value) => updateField('activityLevel', value as ActivityLevel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu nível" />
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
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <Label>Alergias Alimentares</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    placeholder="Ex: Amendoim"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                  />
                  <Button type="button" onClick={addAllergy}>
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.allergies.map((allergy, index) => (
                    <Badge key={index} variant="secondary">
                      {allergy}
                      <button
                        onClick={() => removeAllergy(index)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Restrições Alimentares</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={restrictionInput}
                    onChange={(e) => setRestrictionInput(e.target.value)}
                    placeholder="Ex: Vegetariano, Sem lactose"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRestriction())}
                  />
                  <Button type="button" onClick={addRestriction}>
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.restrictions.map((restriction, index) => (
                    <Badge key={index} variant="secondary">
                      {restriction}
                      <button
                        onClick={() => removeRestriction(index)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                className="ml-auto"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={calculateMetrics.isPending || createProfile.isPending}
                className="ml-auto"
              >
                {(calculateMetrics.isPending || createProfile.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Finalizar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};