import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCheck, Mail, FileText, Calendar } from "lucide-react";
import { useNutritionistRequest } from "@/hooks/useNutritionistRequest";
import { useProfile } from "@/hooks/useProfile";

export const RequestNutritionistCard = () => {
  const [agreed, setAgreed] = useState(false);
  const { mutate: requestNutritionist, isPending } = useNutritionistRequest();
  const { profile } = useProfile();

  const handleRequest = () => {
    if (!agreed) {
      return;
    }
    requestNutritionist();
  };

  if (profile?.nutritionist_request_sent) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <UserCheck className="h-5 w-5" />
            Solicitação Enviada
          </CardTitle>
          <CardDescription>
            Sua solicitação de avaliação com nutricionista foi enviada com sucesso!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Um nutricionista irá analisar seu perfil e entrar em contato em breve para agendar sua consulta.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Avaliação com Nutricionista
        </CardTitle>
        <CardDescription>
          Solicite uma avaliação completa com um nutricionista especializado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Relatório Completo</p>
              <p className="text-muted-foreground">
                Enviaremos seu perfil nutricional, IMC, TMB e diário alimentar dos últimos 7 dias
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Mail className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Contato Direto</p>
              <p className="text-muted-foreground">
                Um nutricionista irá analisar seu caso e entrar em contato por email
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Agendamento</p>
              <p className="text-muted-foreground">
                Receba um link para agendar sua consulta de forma conveniente
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-start gap-2 mb-4">
            <Checkbox 
              id="agree" 
              checked={agreed} 
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <label 
              htmlFor="agree" 
              className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
            >
              Concordo em compartilhar meus dados nutricionais com um nutricionista qualificado 
              para avaliação profissional. Entendo que este é um serviço de orientação nutricional.
            </label>
          </div>

          <Button 
            onClick={handleRequest} 
            disabled={!agreed || isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? 'Enviando...' : 'Solicitar Avaliação com Nutricionista'}
          </Button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            <strong>⚠️ Atenção:</strong> Este assistente virtual fornece orientações gerais. 
            Para um acompanhamento personalizado e seguro, especialmente em casos clínicos, 
            recomendamos a avaliação com um nutricionista humano.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
