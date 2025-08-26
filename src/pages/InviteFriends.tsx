
import React, { useState } from 'react';
import { ArrowLeft, Copy, Share2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const InviteFriends = () => {
  const [email, setEmail] = useState('');
  
  const referralCode = 'FITNESS2025'; // In a real app, this would come from the user's profile
  const referralLink = `https://fitness-app.com/join?ref=${referralCode}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink)
      .then(() => toast.success('Link copiado para a área de transferência'))
      .catch(() => toast.error('Falha ao copiar o link'));
  };
  
  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Junte-se a mim no FitnessApp',
        text: 'Experimente este incrível app de fitness!',
        url: referralLink,
      })
      .then(() => toast.success('Link compartilhado'))
      .catch((error) => {
        console.error('Erro ao compartilhar:', error);
        toast.error('Falha ao compartilhar o link');
      });
    } else {
      toast.error('Função de compartilhamento não disponível no seu dispositivo');
    }
  };
  
  const handleInviteByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor, insira um email válido');
      return;
    }
    
    // In a real app, this would make an API call to send the invitation
    toast.success(`Convite enviado para ${email}`);
    setEmail('');
  };

  return (
    <main className="container">
      <section className="mobile-section">
        <div className="mb-6 flex items-center">
          <Link to="/profile" className="mr-2">
            <ArrowLeft className="text-fitness-orange" />
          </Link>
          <h1 className="text-2xl font-bold">Convidar Amigos</h1>
        </div>
        
        <div className="space-y-6">
          <div className="bg-fitness-darkGray p-6 rounded-lg text-center">
            <UserPlus className="h-16 w-16 text-fitness-orange mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ganhe 7 dias grátis</h2>
            <p className="text-gray-300 mb-4">
              Para cada amigo que se cadastrar usando seu link ou código, você ganha 7 dias de acesso premium.
            </p>
            
            <div className="bg-fitness-dark p-4 rounded-lg mb-4">
              <p className="text-center text-sm text-gray-400 mb-1">Seu código de referência</p>
              <div className="text-xl font-mono font-bold text-fitness-orange tracking-wider">
                {referralCode}
              </div>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={handleCopyLink}
                className="w-full bg-fitness-orange hover:bg-fitness-orange/90 flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                <span>Copiar Link</span>
              </Button>
              
              <Button
                onClick={handleShareLink}
                className="w-full bg-fitness-dark hover:bg-fitness-dark/80 flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                <span>Compartilhar</span>
              </Button>
            </div>
          </div>
          
          <div className="bg-fitness-darkGray p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Convidar por Email</h2>
            <form onSubmit={handleInviteByEmail} className="flex flex-col space-y-3">
              <Input
                type="email"
                placeholder="Email do seu amigo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-fitness-dark border-gray-700"
              />
              <Button type="submit" className="bg-fitness-orange hover:bg-fitness-orange/90">
                Enviar Convite
              </Button>
            </form>
          </div>
          
          <div className="bg-fitness-darkGray p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Convites Enviados</h2>
            <div className="space-y-2 text-sm text-gray-400">
              <p>Nenhum convite enviado ainda</p>
              <p>Quando você enviar convites, eles aparecerão aqui</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default InviteFriends;
