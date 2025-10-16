import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Smartphone, Heart, Activity, Moon, Zap } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface HealthOnboardingProps {
  onComplete?: () => void;
  className?: string;
}

export function HealthOnboarding({ onComplete, className }: HealthOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao ILIVI Health',
      description: 'Sincronize seus dados de saúde e acompanhe seu progresso automaticamente',
      icon: <Heart className="h-6 w-6 text-primary" />,
      completed: false
    },
    {
      id: 'companion',
      title: isNative ? 'Abrir App Companion' : 'Instalar App Móvel',
      description: isNative 
        ? 'Use o app companion para registrar dispositivos e configurar sincronização em segundo plano'
        : 'Para acessar dados de saúde, instale o app móvel do ILIVI',
      icon: <Smartphone className="h-6 w-6 text-primary" />,
      completed: false
    },
    {
      id: 'permissions',
      title: `Conectar ${platform === 'ios' ? 'HealthKit' : 'Health Connect'}`,
      description: `Conceda permissões para acessar dados de passos, frequência cardíaca, sono e calorias no ${platform === 'ios' ? 'HealthKit' : 'Health Connect'}`,
      icon: <Activity className="h-6 w-6 text-primary" />,
      completed: false
    },
    {
      id: 'sync',
      title: 'Primeira Sincronização',
      description: 'Sincronize seus dados pela primeira vez e configure a sincronização automática',
      icon: <Zap className="h-6 w-6 text-primary" />,
      completed: false
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Card className={`bg-secondary border-border ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Configuração de Saúde</CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure sua integração com dados de saúde em poucos passos
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-primary text-primary">
            {currentStep + 1} de {steps.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center
                ${index <= currentStep 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-muted text-muted-foreground'
                }
              `}>
                {index < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-12 h-0.5 mx-2
                  ${index < currentStep ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Current step content */}
        <div className="bg-secondary rounded-lg p-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
            {currentStepData.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {currentStepData.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Step-specific content */}
          {currentStep === 0 && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-secondary p-4 rounded-lg">
                <Activity className="h-8 w-8 text-primary mb-2 mx-auto" />
                <p className="text-sm text-muted-foreground">Passos Diários</p>
              </div>
              <div className="bg-secondary p-4 rounded-lg">
                <Heart className="h-8 w-8 text-red-400 mb-2 mx-auto" />
                <p className="text-sm text-muted-foreground">Frequência Cardíaca</p>
              </div>
              <div className="bg-secondary p-4 rounded-lg">
                <Moon className="h-8 w-8 text-blue-400 mb-2 mx-auto" />
                <p className="text-sm text-muted-foreground">Qualidade do Sono</p>
              </div>
              <div className="bg-secondary p-4 rounded-lg">
                <Zap className="h-8 w-8 text-yellow-400 mb-2 mx-auto" />
                <p className="text-sm text-muted-foreground">Calorias Queimadas</p>
              </div>
            </div>
          )}

          {currentStep === 1 && !isNative && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                💡 Para acessar dados de saúde reais, você precisa usar o app móvel nativo do ILIVI em seu smartphone.
              </p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="border-muted text-muted-foreground hover:bg-secondary"
          >
            Anterior
          </Button>
          <Button
            onClick={nextStep}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}