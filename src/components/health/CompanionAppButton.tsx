import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import HealthCompanionLauncher from '@/plugins/HealthCompanionLauncher';

export function CompanionAppButton() {
  const { session } = useAuth();

  const openCompanionApp = async () => {
    if (!session?.access_token) {
      toast("Você precisa estar logado para usar o app companion");
      return;
    }

    if (Capacitor.isNativePlatform()) {
      // Se estamos na plataforma nativa, tentar abrir a HealthCompanionActivity
      try {
        if (Capacitor.getPlatform() === 'android') {
          // Para Android, usar o plugin personalizado
          const result = await HealthCompanionLauncher.launch({
            jwtToken: session.access_token
          });
          
          if (result.success) {
            toast("App companion aberto com sucesso!");
          } else {
            toast("Erro ao abrir o app companion");
          }
        } else if (Capacitor.getPlatform() === 'ios') {
          // Para iOS, abrir o ContentView do companion app
          await (window as any).HealthCompanionApp?.launch({
            jwtToken: session.access_token
          });
        }
      } catch (error) {
        console.error('Error launching companion app:', error);
        toast("Erro ao abrir o app companion. Verifique se está instalado.");
      }
    } else {
      // Se estamos na web, mostrar instruções
      toast("O app companion está disponível apenas na versão móvel do aplicativo");
    }
  };

  if (!Capacitor.isNativePlatform()) {
    return null; // Não mostrar na web
  }

  return (
    <Card className="bg-fitness-darkGray border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-fitness-orange" />
          App Companion de Saúde
        </CardTitle>
        <CardDescription className="text-gray-400">
          Abra o app companion para registrar dispositivos e sincronizar dados de saúde em segundo plano
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={openCompanionApp}
          className="w-full bg-fitness-orange hover:bg-fitness-orange/90 text-white"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir App Companion
        </Button>
      </CardContent>
    </Card>
  );
}