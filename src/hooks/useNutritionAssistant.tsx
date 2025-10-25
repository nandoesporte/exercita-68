import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  user_profile?: {
    peso_kg?: number;
    altura_cm?: number;
    idade?: number;
    objetivo?: string;
  };
}

export const useNutritionAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou o Assistente NutriEx. Como posso ajudar você hoje com suas dúvidas sobre nutrição?',
      timestamp: new Date()
    }
  ]);

  const sendMessage = useMutation({
    mutationFn: async ({ message, user_profile }: { message: string; user_profile?: ChatRequest['user_profile'] }) => {
      // Add user message to chat
      const userMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Prepare messages for API (exclude timestamps)
      const apiMessages = [...messages, userMessage].map(({ role, content }) => ({
        role,
        content
      }));

      const { data, error } = await supabase.functions.invoke('nutrition-assistant', {
        body: {
          messages: apiMessages,
          user_profile
        }
      });

      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar mensagem');
      }

      return data.message;
    },
    onSuccess: (assistantMessage: string) => {
      const newMessage: Message = {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
    },
    onError: (error: Error) => {
      console.error('Erro no chat:', error);
      toast.error('Erro ao enviar mensagem: ' + error.message);
      
      // Remove the failed user message
      setMessages(prev => prev.slice(0, -1));
    },
  });

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Olá! Sou o Assistente NutriEx. Como posso ajudar você hoje com suas dúvidas sobre nutrição?',
        timestamp: new Date()
      }
    ]);
  };

  return {
    messages,
    sendMessage: sendMessage.mutate,
    isLoading: sendMessage.isPending,
    clearChat
  };
};

export type { Message };
