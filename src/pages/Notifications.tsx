
import React from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Notifications = () => {
  const handleToggle = (type: string, enabled: boolean) => {
    toast.success(`Notificações de ${type} ${enabled ? 'ativadas' : 'desativadas'}`);
  };
  
  return (
    <main className="container">
      <section className="mobile-section">
        <div className="mb-6 flex items-center">
          <Link to="/profile" className="mr-2">
            <ArrowLeft className="text-fitness-orange" />
          </Link>
          <h1 className="text-2xl font-bold">Preferências de Notificações</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-fitness-darkGray p-4 rounded-lg mb-6">
            <div className="flex items-center mb-2">
              <Bell className="h-5 w-5 text-fitness-orange mr-2" />
              <h2 className="font-semibold">Sobre Notificações</h2>
            </div>
            <p className="text-sm text-gray-300">
              Configure quais notificações você deseja receber. Você pode alterar essas preferências a qualquer momento.
            </p>
          </div>

          <div className="space-y-6">
            {/* Treinos */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Treinos</h2>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="workout-reminders">Lembretes de treino</Label>
                <Switch 
                  id="workout-reminders" 
                  defaultChecked={true}
                  onCheckedChange={(checked) => handleToggle('lembretes de treino', checked)} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="workout-updates">Atualizações de treinos</Label>
                <Switch 
                  id="workout-updates" 
                  defaultChecked={true}
                  onCheckedChange={(checked) => handleToggle('atualizações de treinos', checked)} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="workout-completed">Treinos completados</Label>
                <Switch 
                  id="workout-completed" 
                  defaultChecked={true}
                  onCheckedChange={(checked) => handleToggle('treinos completados', checked)} 
                />
              </div>
            </div>

            {/* Agendamentos */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Agendamentos</h2>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="appointment-reminders">Lembretes de agendamento</Label>
                <Switch 
                  id="appointment-reminders" 
                  defaultChecked={true}
                  onCheckedChange={(checked) => handleToggle('lembretes de agendamento', checked)} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="appointment-changes">Alterações em agendamentos</Label>
                <Switch 
                  id="appointment-changes" 
                  defaultChecked={true}
                  onCheckedChange={(checked) => handleToggle('alterações em agendamentos', checked)} 
                />
              </div>
            </div>

            {/* Atualizações do App */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Atualizações e Novidades</h2>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="app-updates">Novas funcionalidades</Label>
                <Switch 
                  id="app-updates" 
                  defaultChecked={true}
                  onCheckedChange={(checked) => handleToggle('novas funcionalidades', checked)} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="promotions">Promoções e ofertas</Label>
                <Switch 
                  id="promotions" 
                  defaultChecked={false}
                  onCheckedChange={(checked) => handleToggle('promoções', checked)} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="newsletters">Boletins informativos</Label>
                <Switch 
                  id="newsletters" 
                  defaultChecked={false}
                  onCheckedChange={(checked) => handleToggle('boletins informativos', checked)} 
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Notifications;
