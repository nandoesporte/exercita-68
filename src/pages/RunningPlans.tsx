import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RunningPlanViewer } from '@/components/ui/running-plan-viewer';
import { useRunningPlans, RunningPlanFormData, RunningPlanItem, RunningPlan } from '@/hooks/useRunningPlans';
import { Loader2, Play, Save, Trash2, Calendar, Clock, Target, User, Weight, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const formSchema = z.object({
  age: z.number().min(12, 'Idade mínima é 12 anos').max(80, 'Idade máxima é 80 anos'),
  weight: z.number().min(30, 'Peso mínimo é 30kg').max(200, 'Peso máximo é 200kg'),
  fitness_level: z.enum(['iniciante', 'intermediário', 'avançado']),
  goal: z.enum(['emagrecimento', 'resistência', 'velocidade', 'saúde geral']),
  available_time: z.string().min(1, 'Selecione o tempo disponível'),
});

const RunningPlans = () => {
  const { 
    plans, 
    isLoadingPlans, 
    generatePlan, 
    isGenerating, 
    savePlan, 
    isSavingPlan,
    deletePlan,
    isDeletingPlan
  } = useRunningPlans();
  
  const [generatedPlan, setGeneratedPlan] = useState<RunningPlanItem[] | null>(null);
  const [formData, setFormData] = useState<RunningPlanFormData | null>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<RunningPlan | null>(null);
  const [isPlanViewerOpen, setIsPlanViewerOpen] = useState(false);

  const form = useForm<RunningPlanFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 25,
      weight: 70,
      fitness_level: 'iniciante',
      goal: 'saúde geral',
      available_time: '30 min 3x/semana',
    },
  });

  const onSubmit = async (data: RunningPlanFormData) => {
    try {
      console.log('Submitting form with data:', data);
      const plan = await generatePlan(data);
      setGeneratedPlan(plan);
      setFormData(data);
      
      // Generate default title
      const defaultTitle = `Plano ${data.fitness_level} - ${data.goal} (${new Date().toLocaleDateString('pt-BR')})`;
      setPlanTitle(defaultTitle);
    } catch (error) {
      console.error('Error generating plan:', error);
    }
  };

  const handleSavePlan = () => {
    if (!generatedPlan || !formData) return;

    const title = planTitle.trim() || `Plano ${formData.fitness_level} - ${formData.goal}`;
    
    savePlan({
      title,
      plan: generatedPlan,
      age: formData.age,
      weight: formData.weight,
      fitness_level: formData.fitness_level,
      goal: formData.goal,
      available_time: formData.available_time,
    });

    // Reset form
    setGeneratedPlan(null);
    setFormData(null);
    setPlanTitle('');
  };

  const handleViewPlan = (plan: RunningPlan) => {
    setSelectedPlan(plan);
    setIsPlanViewerOpen(true);
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'leve':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'moderada':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'intensa':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">Treinos de Corrida</h1>
        <p className="text-base sm:text-lg text-muted-foreground px-2">
          Gere planos de corrida e caminhada personalizados com inteligência artificial
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Gerar Novo Plano
            </CardTitle>
            <CardDescription>
              Preencha os dados abaixo para gerar um plano personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Idade
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="25"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Weight className="h-4 w-4" />
                          Peso (kg)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="70"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fitness_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Condicionamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="iniciante">Iniciante</SelectItem>
                          <SelectItem value="intermediário">Intermediário</SelectItem>
                          <SelectItem value="avançado">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Objetivo
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu objetivo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                          <SelectItem value="resistência">Resistência</SelectItem>
                          <SelectItem value="velocidade">Velocidade</SelectItem>
                          <SelectItem value="saúde geral">Saúde Geral</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="available_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Tempo Disponível
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tempo disponível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30 min 3x/semana">30 min 3x/semana</SelectItem>
                          <SelectItem value="45 min 3x/semana">45 min 3x/semana</SelectItem>
                          <SelectItem value="30 min 4x/semana">30 min 4x/semana</SelectItem>
                          <SelectItem value="45 min 4x/semana">45 min 4x/semana</SelectItem>
                          <SelectItem value="60 min 3x/semana">60 min 3x/semana</SelectItem>
                          <SelectItem value="60 min 4x/semana">60 min 4x/semana</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando plano...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Gerar treino com IA
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Generated Plan Section */}
        {generatedPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Plano Gerado
              </CardTitle>
              <CardDescription>
                Plano de 4 semanas personalizado para você
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="plan-title">Título do Plano</Label>
                <Input
                  id="plan-title"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="Digite um título para o plano"
                  className="mt-1"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {[1, 2, 3, 4].map((week) => (
                  <div key={week} className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2 text-sm">Semana {week}</h4>
                    <div className="space-y-2">
                      {generatedPlan
                        .filter((item) => item.semana === week)
                        .map((item, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs bg-muted p-2 rounded gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium block">{item.dia}</span>
                              <p className="text-muted-foreground break-words">{item.atividade}</p>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                              <p className="font-medium">{item.duracao_min} min</p>
                              <Badge className={`text-xs ${getIntensityColor(item.intensidade)}`}>
                                {item.intensidade}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleSavePlan} 
                className="w-full" 
                disabled={isSavingPlan}
              >
                {isSavingPlan ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar plano
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Saved Plans Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Meus Planos Salvos</h2>
        
        {isLoadingPlans ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <CardDescription>
                    Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{plan.age} anos, {plan.weight}kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="capitalize">{plan.fitness_level} - {plan.goal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{plan.available_time}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="text-sm">
                    <p className="font-medium mb-2">Plano de treino:</p>
                    <div className="max-h-48 overflow-y-auto space-y-2 bg-muted/30 p-3 rounded-lg">
                      {[1, 2, 3, 4].map((week) => {
                        const weekActivities = plan.plan.filter((item) => item.semana === week);
                        return weekActivities.length > 0 ? (
                          <div key={week} className="border-l-2 border-primary/20 pl-2">
                            <h5 className="font-medium text-xs text-primary mb-1">Semana {week}</h5>
                            <div className="space-y-1">
                              {weekActivities.map((item, index) => (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium block">{item.dia}</span>
                                    <p className="text-muted-foreground text-xs break-words">{item.atividade}</p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <p className="font-medium">{item.duracao_min}min</p>
                                    <Badge className={`text-xs h-4 ${getIntensityColor(item.intensidade)}`}>
                                      {item.intensidade}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                    <p className="text-muted-foreground text-xs mt-2">
                      {plan.plan.length} atividades distribuídas em 4 semanas
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewPlan(plan)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver completo
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeletingPlan}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir plano</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o plano "{plan.title}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deletePlan(plan.id)}
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
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Você ainda não tem planos salvos. Gere seu primeiro plano acima!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Plan Viewer Modal */}
      <RunningPlanViewer 
        plan={selectedPlan}
        open={isPlanViewerOpen}
        onOpenChange={setIsPlanViewerOpen}
      />
    </div>
  );
};

export default RunningPlans;