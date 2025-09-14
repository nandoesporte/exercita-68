import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, Target, Clock, Calendar } from 'lucide-react';
import { RunningPlan } from '@/hooks/useRunningPlans';

interface RunningPlanViewerProps {
  plan: RunningPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RunningPlanViewer({ plan, open, onOpenChange }: RunningPlanViewerProps) {
  if (!plan) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{plan.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Plan Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{plan.age} anos, {plan.weight}kg</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{plan.fitness_level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{plan.goal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{plan.available_time}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Criado em {new Date(plan.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Plan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Plano de Treino - 4 Semanas</h3>
            
            <div className="grid gap-4">
              {[1, 2, 3, 4].map((week) => {
                const weekActivities = plan.plan.filter((item) => item.semana === week);
                
                if (weekActivities.length === 0) return null;
                
                return (
                  <Card key={week}>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-4 text-primary flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Semana {week}
                      </h4>
                      
                      <div className="space-y-3">
                        {weekActivities.map((item, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm mb-1">
                                {item.dia}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.atividade}
                              </div>
                            </div>
                            
                            <div className="text-right flex items-center gap-3">
                              <div className="text-sm">
                                <div className="font-medium">{item.duracao_min} min</div>
                              </div>
                              <Badge className={getIntensityColor(item.intensidade)}>
                                {item.intensidade}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                <p className="font-medium mb-1">Resumo do Plano</p>
                <p>{plan.plan.length} atividades distribuídas em 4 semanas</p>
                <p>Plano personalizado para {plan.fitness_level} com foco em {plan.goal}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}