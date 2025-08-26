import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MessageSquare, Send, User, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast-wrapper';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardDescription } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { supabase } from '@/integrations/supabase/client';
import { usePersonalTrainer } from '@/hooks/usePersonalTrainer';

// Default fallback WhatsApp number if not loaded from DB
const DEFAULT_WHATSAPP = "44997270698";

const scheduleFormSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  date: z.date({ required_error: 'Por favor selecione uma data' }),
  time: z.string().min(1, { message: 'Por favor selecione um horário' }),
  goal: z.string().min(10, { message: 'Por favor descreva o objetivo com pelo menos 10 caracteres' }),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

// Interface for Personal Trainer data
interface PersonalTrainer {
  name: string;
  credentials: string;
  bio: string;
  whatsapp: string;
  photo_url: string | null;
}

const Schedule = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');
  const { trainer, isLoading } = usePersonalTrainer();

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: '',
      goal: '',
      time: '',
    },
  });

  const onSubmit = (data: ScheduleFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Formata a data e hora para exibição na mensagem
      const formattedDate = format(data.date, 'dd/MM/yyyy');
      
      // Cria a mensagem para o WhatsApp
      const message = `Olá! Gostaria de agendar uma consultoria:\n\n*Nome:* ${data.name}\n*Data:* ${formattedDate}\n*Hora:* ${data.time}\n*Objetivo:* ${data.goal}`;
      
      // Cria o link para o WhatsApp com a mensagem
      const whatsappNumber = trainerData?.whatsapp || DEFAULT_WHATSAPP;
      const encodedMessage = encodeURIComponent(message);
      const link = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      setWhatsappLink(link);
      
      toast("Agendamento criado com sucesso! Clique no botão abaixo para confirmar pelo WhatsApp.");
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast("Erro no agendamento: Não foi possível criar o agendamento. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Horários disponíveis para agendamento
  const availableTimeSlots = [
    '08:00', '09:00', '10:00', '11:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00',
  ];

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-10 flex justify-center">
        <div className="animate-pulse space-y-6 w-full">
          <div className="h-32 bg-gray-200 rounded-lg w-full"></div>
          <div className="h-12 bg-gray-200 rounded-lg w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  // Default trainer data if none found
  const trainerData = trainer || {
    name: 'Personal Trainer',
    credentials: 'Personal Trainer - CREF',
    bio: 'Especialista em treinamento funcional e hipertrofia.',
    whatsapp: DEFAULT_WHATSAPP,
    photo_url: null
  };

  return (
    <div className="container max-w-4xl mx-auto pb-10">
      {/* Personal Trainer Profile Card */}
      <Card className="mb-8 overflow-hidden bg-gradient-to-r from-fitness-darkGray to-fitness-dark border-none">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <AspectRatio ratio={1/1} className="bg-muted">
              <div className="h-full w-full p-2">
                <Avatar className="h-full w-full rounded-xl">
                  {trainerData?.photo_url ? (
                    <AvatarImage 
                      src={trainerData.photo_url} 
                      alt={trainerData.name} 
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="text-4xl bg-fitness-green text-white">
                      {trainerData?.name?.charAt(0) || 'P'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
            </AspectRatio>
          </div>
          <div className="md:col-span-2 p-6 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-white mb-2">{trainerData?.name}</h2>
            <p className="text-fitness-green font-medium mb-4">{trainerData?.credentials}</p>
            <CardDescription className="text-gray-300 text-base">
              {trainerData?.bio}
            </CardDescription>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-fitness-green to-fitness-blue">
            Agende sua Consultoria
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Agende uma consulta personalizada para discutir seus objetivos e criar um plano de treinamento ideal para você.
          </p>
        </div>

        {!whatsappLink ? (
          <Card className="p-6 shadow-lg border-fitness-darkGray/30">
            <CardContent className="p-0 pt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Nome</FormLabel>
                        <FormControl>
                          <div className="flex items-center border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-fitness-green focus-within:ring-offset-2">
                            <User className="ml-3 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Seu nome completo" {...field} className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-base">Data</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal flex items-center border-input focus:ring-2 focus:ring-fitness-green",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Selecione uma data</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  // Desabilita datas passadas e finais de semana
                                  const now = new Date();
                                  now.setHours(0, 0, 0, 0);
                                  const day = date.getDay();
                                  return date < now || day === 0 || day === 6;
                                }}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Horário</FormLabel>
                          <FormControl>
                            <div className="flex items-center border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-fitness-green focus-within:ring-offset-2">
                              <Clock className="ml-3 h-4 w-4 text-muted-foreground" />
                              <select
                                className="flex w-full rounded-md bg-transparent px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                                defaultValue=""
                              >
                                <option value="" disabled>Selecione um horário</option>
                                {availableTimeSlots.map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="goal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Objetivo da Consultoria</FormLabel>
                        <FormControl>
                          <div className="flex border border-input bg-background rounded-md focus-within:ring-2 focus-within:ring-fitness-green focus-within:ring-offset-2">
                            <div className="p-3">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <Textarea
                              placeholder="Descreva o que gostaria de abordar na consultoria..."
                              className="min-h-24 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-fitness-green to-fitness-blue hover:from-fitness-darkGreen hover:to-fitness-darkGreen text-white font-bold rounded-xl py-6 transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Agendar Consultoria
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-6 bg-gradient-to-br from-gray-900 to-fitness-darkGray border-none text-center space-y-8">
            <CardContent className="p-0 space-y-8">
              <div className="space-y-4">
                <div className="mx-auto bg-fitness-green/10 text-fitness-green rounded-full w-20 h-20 flex items-center justify-center">
                  <MessageCircle className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-white">Agendamento Realizado!</h2>
                <p className="text-gray-300 max-w-md mx-auto">
                  Para confirmar seu agendamento com {trainerData?.name || 'o Personal Trainer'}, clique no botão abaixo para enviar os detalhes pelo WhatsApp.
                </p>
              </div>

              <Button 
                asChild
                className="w-full bg-gradient-to-r from-fitness-green to-fitness-blue hover:opacity-90 text-white font-bold rounded-xl py-6"
              >
                <a 
                  href={whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  Confirmar pelo WhatsApp
                </a>
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => setWhatsappLink('')}
                className="w-full hover:bg-fitness-darkGray/50 text-white"
              >
                Fazer outro agendamento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Schedule;
