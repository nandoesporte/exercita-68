
import React, { useState } from 'react';
import { ArrowLeft, Bell, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [metricSystem, setMetricSystem] = useState(true); // true for metric, false for imperial
  const [language, setLanguage] = useState('pt-BR');

  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked);
    toast.success(`Modo ${checked ? 'escuro' : 'claro'} ativado`);
    // Here you would actually implement the theme change
    // document.documentElement.classList.toggle('dark', checked);
  };

  const handlePushNotificationChange = (checked: boolean) => {
    setPushNotifications(checked);
    toast.success(`Notificações push ${checked ? 'ativadas' : 'desativadas'}`);
  };

  const handleEmailNotificationChange = (checked: boolean) => {
    setEmailNotifications(checked);
    toast.success(`Notificações por email ${checked ? 'ativadas' : 'desativadas'}`);
  };

  const handleMetricSystemChange = (checked: boolean) => {
    setMetricSystem(checked);
    toast.success(`Sistema ${checked ? 'métrico' : 'imperial'} selecionado`);
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value);
    toast.success(`Idioma alterado para ${event.target.value === 'pt-BR' ? 'Português' : 'Inglês'}`);
  };

  return (
    <main className="container">
      <section className="mobile-section">
        <div className="mb-6 flex items-center">
          <Link to="/profile" className="mr-2">
            <ArrowLeft className="text-fitness-orange" />
          </Link>
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Aparência</h2>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {darkMode ? <Moon className="h-5 w-5 text-fitness-orange" /> : <Sun className="h-5 w-5 text-fitness-orange" />}
                <Label htmlFor="dark-mode">Modo Escuro</Label>
              </div>
              <Switch id="dark-mode" checked={darkMode} onCheckedChange={handleDarkModeChange} />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="language">Idioma</Label>
              <select 
                id="language" 
                value={language}
                onChange={handleLanguageChange}
                className="bg-fitness-darkGray border border-gray-700 rounded p-2 w-32"
              >
                <option value="pt-BR">Português</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Notificações</h2>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-fitness-orange" />
                <Label htmlFor="push-notifications">Notificações Push</Label>
              </div>
              <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={handlePushNotificationChange} />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Notificações por Email</Label>
              <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={handleEmailNotificationChange} />
            </div>
          </div>

          {/* Units */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Unidades</h2>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="metric-system">Sistema Métrico (kg, cm)</Label>
              <Switch id="metric-system" checked={metricSystem} onCheckedChange={handleMetricSystemChange} />
            </div>
            
            <p className="text-sm text-gray-400">
              {metricSystem 
                ? "Usando unidades métricas (kg, cm)" 
                : "Usando unidades imperiais (lb, ft, in)"}
            </p>
          </div>

          {/* Privacy */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Privacidade</h2>
            
            <div className="bg-fitness-darkGray p-4 rounded-lg">
              <p className="text-sm">
                Para gerenciar suas preferências de privacidade e dados, acesse seu 
                perfil e selecione a opção "Privacidade".
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Settings;
