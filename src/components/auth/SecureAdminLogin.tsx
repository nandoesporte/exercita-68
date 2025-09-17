import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/lib/toast-wrapper';
import { Shield, Lock } from 'lucide-react';

interface SecureAdminLoginProps {
  onSuccess?: () => void;
}

export function SecureAdminLogin({ onSuccess }: SecureAdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('secure_admin_login', {
        p_username: username.trim(),
        p_password: password
      });

      if (error) {
        console.error('Admin login error:', error);
        toast.error('Erro interno do servidor');
        return;
      }

      if (!data?.success) {
        toast.error(data?.message || 'Credenciais inválidas');
        return;
      }

      toast.success('Login administrativo realizado com sucesso!');
      onSuccess?.();
      
      // Clear form
      setUsername('');
      setPassword('');
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('Erro inesperado durante o login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20">
            <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Login Administrativo Seguro</CardTitle>
        <CardDescription className="text-center">
          Acesso restrito para administradores autorizados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nome de Usuário</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Digite seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Verificando...' : 'Fazer Login'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Segurança Aprimorada</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Senhas são criptografadas com segurança</li>
                <li>Tentativas de login são limitadas</li>
                <li>Contas são bloqueadas após tentativas falharam excessivas</li>
                <li>Todas as ações são registradas para auditoria</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}