
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isSameDay, parseISO, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CalendarIcon, Clock, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

// Define the time slots that are available for booking
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

// Define the duration options in minutes
const DURATION_OPTIONS = [30, 45, 60, 90, 120];

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_date: string;
  duration: number;
  trainer_name: string;
  status: string;
  user_id: string | null;
}

const AppointmentManagement = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Fetch appointments (filtered by RLS automatically)
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['admin-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
  });

  // Filter appointments for the selected date
  const appointmentsForSelectedDate = date
    ? appointments.filter(appointment => 
        isSameDay(parseISO(appointment.appointment_date), date)
      )
    : [];

  // Create a map of used time slots for the selected date
  const usedTimeSlots = new Map();
  appointmentsForSelectedDate.forEach(appointment => {
    const appointmentTime = format(parseISO(appointment.appointment_date), 'HH:mm');
    const endTime = format(
      addMinutes(parseISO(appointment.appointment_date), appointment.duration),
      'HH:mm'
    );
    
    // Mark this time slot and any overlapping slots as used
    TIME_SLOTS.forEach(slot => {
      const slotTime = slot;
      if (slotTime >= appointmentTime && slotTime < endTime) {
        usedTimeSlots.set(slotTime, appointment.id);
      }
    });
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (newAppointment: Omit<Appointment, 'id'>) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert([newAppointment])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      toast.success('Consulta agendada com sucesso!');
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao agendar consulta: ${error.message}`);
    },
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;
      return appointmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      toast.success('Consulta cancelada com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error) => {
      toast.error(`Erro ao cancelar consulta: ${error.message}`);
    },
  });

  const handleCreateAppointment = () => {
    if (!date || !selectedTime || !title || !trainerName) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const appointmentDateTime = new Date(date);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const newAppointment = {
      title,
      description,
      appointment_date: appointmentDateTime.toISOString(),
      duration: selectedDuration,
      trainer_name: trainerName,
      status,
      // admin_id será definido automaticamente pelo trigger RLS
    };

    createAppointmentMutation.mutate(newAppointment as any);
  };

  const resetForm = () => {
    setIsCreating(false);
    setSelectedTime(undefined);
    setSelectedDuration(60);
    setTitle('');
    setDescription('');
    setTrainerName('');
    setStatus('scheduled');
  };

  // Filter appointments by past/upcoming
  const now = new Date();
  const upcomingAppointments = appointments.filter(
    appointment => new Date(appointment.appointment_date) >= now
  );
  const pastAppointments = appointments.filter(
    appointment => new Date(appointment.appointment_date) < now
  );

  // Get appointments to display based on active tab
  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <div className="space-y-4 pb-16 md:pb-0">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Gerenciamento de Consultas</h1>
        <Button onClick={() => setIsCreating(true)}>Nova Consulta</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Consultas Agendadas</CardTitle>
            <CardDescription>Visualize e gerencie as consultas e agendamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border w-full"
            />
          </CardContent>
        </Card>

        <div className={`${isMobile ? 'col-span-1' : 'col-span-2'}`}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {date ? format(date, "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Selecione uma data'}
              </CardTitle>
              <CardDescription>
                {appointmentsForSelectedDate.length 
                  ? `${appointmentsForSelectedDate.length} consultas agendadas` 
                  : 'Nenhuma consulta agendada para esta data'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : appointmentsForSelectedDate.length > 0 ? (
                  appointmentsForSelectedDate.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex justify-between items-center p-3 rounded-md border hover:bg-muted/50"
                    >
                      <div>
                        <div className="font-medium">{appointment.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(parseISO(appointment.appointment_date), 'HH:mm')} - {appointment.trainer_name}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhuma consulta agendada para esta data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="upcoming">Próximas</TabsTrigger>
              <TabsTrigger value="past">Anteriores</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayedAppointments.length > 0 ? (
            <div className="space-y-3">
              {displayedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex justify-between items-center p-3 rounded-md border hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{appointment.title}</div>
                    <div className="text-sm text-muted-foreground flex gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {format(parseISO(appointment.appointment_date), "dd/MM/yy 'às' HH:mm")}
                      <span className="mx-1">•</span>
                      <Clock className="h-4 w-4" />
                      {appointment.duration} min
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {appointment.trainer_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-xs ${
                      appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status === 'scheduled' ? 'Agendada' :
                       appointment.status === 'completed' ? 'Concluída' :
                       appointment.status === 'cancelled' ? 'Cancelada' : appointment.status}
                    </div>
                    {activeTab === 'upcoming' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              {activeTab === 'upcoming' ? 'Nenhuma consulta agendada' : 'Nenhuma consulta anterior'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Appointment Dialog */}
      <Dialog open={isCreating} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsCreating(open);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agendar Nova Consulta</DialogTitle>
            <DialogDescription>
              Preencha os dados para agendar uma nova consulta.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Avaliação Física"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trainer">Nome do Profissional</Label>
              <Input
                id="trainer"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                placeholder="Ex: Dr. João Silva"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <div className="flex">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'dd/MM/yyyy') : 'Selecione uma data'}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => {
                      const isDisabled = usedTimeSlots.has(time);
                      return (
                        <SelectItem
                          key={time}
                          value={time}
                          disabled={isDisabled}
                        >
                          {time} {isDisabled ? '(Ocupado)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Select
                value={selectedDuration.toString()}
                onValueChange={(val) => setSelectedDuration(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a duração" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((duration) => (
                    <SelectItem key={duration} value={duration.toString()}>
                      {duration} minutos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione informações adicionais"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateAppointment}
              disabled={
                !date || !selectedTime || !title || !trainerName || 
                createAppointmentMutation.isPending
              }
            >
              {createAppointmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Appointment Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Consulta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta consulta? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="py-4">
              <p>
                <span className="font-semibold">{selectedAppointment.title}</span>
                <br />
                <span className="text-sm text-muted-foreground">
                  {format(parseISO(selectedAppointment.appointment_date), "dd/MM/yy 'às' HH:mm")}
                  {" - "}
                  {selectedAppointment.trainer_name}
                </span>
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setSelectedAppointment(null);
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedAppointment) {
                  deleteAppointmentMutation.mutate(selectedAppointment.id);
                }
              }}
              disabled={deleteAppointmentMutation.isPending}
            >
              {deleteAppointmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentManagement;
