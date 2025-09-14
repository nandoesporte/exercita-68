
import React, { useState, useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isPwaInstalled } from '@/utils/pwaUtils';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from '@/components/ui/motion';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  onClose: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(
    window.deferredPromptEvent || null
  );

  useEffect(() => {
    // Check if already installed
    if (isPwaInstalled()) {
      console.log('PWA already installed, not showing prompt');
      handleClose();
      return;
    }

    // Check if install prompt is available
    if (!promptRef.current) {
      console.log('No install prompt available');
      handleClose();
      return;
    }
    
    console.log('Install prompt is available and showing');

    // Cleanup function
    return () => {
      console.log('PWAInstallPrompt unmounting');
    };
  }, []);

  const handleInstall = async () => {
    if (!promptRef.current) {
      toast.error('Não foi possível instalar o aplicativo');
      return;
    }

    try {
      // Show the install prompt
      await promptRef.current.prompt();
      
      // Wait for user choice
      const choiceResult = await promptRef.current.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        toast.success('Instalação iniciada!');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Close the prompt component
      handleClose();
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast.error('Erro ao instalar o aplicativo');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 left-4 right-4 z-50"
    >
      <Card className="border border-primary/20 bg-black/95 backdrop-blur-sm">
        <button 
          onClick={handleClose} 
          className="absolute right-2 top-2 p-1 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>
        
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center">
            <div className="mr-4 flex-shrink-0">
              <img 
                src="/logo_with_solid_background.png" 
                alt="Exercita Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Instale o aplicativo</h3>
              <p className="text-sm text-muted-foreground">
                Acesse rapidamente e treine mesmo offline
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex gap-3">
            <Button 
              onClick={handleInstall}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Download className="mr-2 h-4 w-4" /> Instalar App
            </Button>
            <Button 
              onClick={handleClose}
              variant="outline" 
              className="border-border text-muted-foreground hover:bg-accent"
            >
              Agora não
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PWAInstallPrompt;
