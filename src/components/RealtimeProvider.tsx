import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RealtimeContextType {
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType>({ isConnected: false });

export const useRealtimeStatus = () => {
  return useContext(RealtimeContext);
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = React.useState(false);

  useEffect(() => {
    console.log('Setting up global realtime connection...');
    setIsConnected(true); // Simplificar por enquanto
    
    return () => {
      console.log('Cleaning up global realtime connection...');
    };
  }, [queryClient]);

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
};