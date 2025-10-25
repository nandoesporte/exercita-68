import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ArrowLeft, Check } from 'lucide-react';
import { useAppointmentsWithProfessionals, useCreateAppointment } from '@/hooks/useHealthcareProfessionals';
import { ProfessionalSelector } from '@/components/appointments/ProfessionalSelector';
import { ProfessionalCard } from '@/components/appointments/ProfessionalCard';
import { HealthcareProfessional } from '@/types/healthcare';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

type BookingStep = 'professional' | 'datetime' | 'details' | 'confirm';

export default function AppointmentsNew() {
  const [activeTab, setActiveTab] = useState('book');
  const [bookingStep, setBookingStep] = useState<BookingStep>('professional');
  const [selectedProfessional, setSelectedProfessional] = useState<HealthcareProfessional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentTitle, setAppointmentTitle] = useState('');
  const [appointmentDescription, setAppointmentDescription] = useState('');
  const [duration, setDuration] = useState<number>(60);

  const { data: appointments, isLoading } = useAppointmentsWithProfessionals();
  const createAppointment = useCreateAppointment();

  const handleProfessionalSelect = (professional: HealthcareProfessional) => {
    setSelectedProfessional(professional);
    setBookingStep('datetime');
  };

  const handleDateTimeNext = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Selecione data e horário');
      return;
    }
    setBookingStep('details');
  };

  const handleDetailsNext = () => {
    if (!appointmentTitle) {
      toast.error('Informe o motivo da consulta');
      return;
    }
    setBookingStep('confirm');
  };

  const handleConfirmBooking = async () => {
    if (!selectedProfessional || !selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(':');
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    await createAppointment.mutateAsync({
      professional_id: selectedProfessional.id,
      appointment_date: appointmentDate.toISOString(),
      duration,
      title: appointmentTitle,
      description: appointmentDescription || undefined,
    });

    // Reset form
    setBookingStep('professional');
    setSelectedProfessional(null);
    setSelectedDate(undefined);
    setSelectedTime('');
    setAppointmentTitle('');
    setAppointmentDescription('');
    setActiveTab('upcoming');
  };

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM, yyyy", { locale: ptBR });
  };

  const formatAppointmentTime = (dateString: string, durationMinutes: number) => {
    const startDate = new Date(dateString);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`;
  };

  const renderBookingStep = () => {
    switch (bookingStep) {
      case 'professional':
        return (
          <ProfessionalSelector
            onSelect={handleProfessionalSelect}
            selectedProfessionalId={selectedProfessional?.id}
          />
        );

      case 'datetime':
        return (
          <div className="space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => setBookingStep('professional')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            <div>
              <h2 className="text-2xl font-bold mb-2">Data e Horário</h2>
              <p className="text-muted-foreground">
                Agendando com {selectedProfessional?.name}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label>Selecione a data</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="time">Horário</Label>
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    min={15}
                    step={15}
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleDateTimeNext} className="w-full">
              Continuar
            </Button>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => setBookingStep('datetime')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            <div>
              <h2 className="text-2xl font-bold mb-2">Detalhes da Consulta</h2>
              <p className="text-muted-foreground">
                Informe o motivo e observações adicionais
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Motivo da consulta *</Label>
                <Input
                  id="title"
                  value={appointmentTitle}
                  onChange={(e) => setAppointmentTitle(e.target.value)}
                  placeholder="Ex: Consulta de rotina, Avaliação física..."
                />
              </div>

              <div>
                <Label htmlFor="description">Observações (opcional)</Label>
                <Textarea
                  id="description"
                  value={appointmentDescription}
                  onChange={(e) => setAppointmentDescription(e.target.value)}
                  placeholder="Adicione informações relevantes para o profissional..."
                  rows={4}
                />
              </div>
            </div>

            <Button onClick={handleDetailsNext} className="w-full">
              Continuar
            </Button>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => setBookingStep('details')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            <div>
              <h2 className="text-2xl font-bold mb-2">Confirmar Agendamento</h2>
              <p className="text-muted-foreground">
                Revise as informações antes de confirmar
              </p>
            </div>

            <Card className="p-6 space-y-6">
              {selectedProfessional && (
                <ProfessionalCard 
                  professional={selectedProfessional} 
                  showContact={false}
                />
              )}

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">
                    {selectedTime} ({duration} minutos)
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-sm font-semibold mb-1">Motivo:</p>
                  <p className="text-sm text-muted-foreground">{appointmentTitle}</p>
                </div>

                {appointmentDescription && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Observações:</p>
                    <p className="text-sm text-muted-foreground">{appointmentDescription}</p>
                  </div>
                )}
              </div>
            </Card>

            <Button 
              onClick={handleConfirmBooking} 
              className="w-full gap-2 bg-turquoise hover:bg-turquoise/90"
              disabled={createAppointment.isPending}
            >
              <Check className="w-4 h-4" />
              Confirmar Agendamento
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="book">Agendar</TabsTrigger>
          <TabsTrigger value="upcoming">
            Próximas ({appointments?.upcoming.length || 0})
          </TabsTrigger>
          <TabsTrigger value="past">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="space-y-6">
          {renderBookingStep()}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6">
          {isLoading ? (
            <p>Carregando...</p>
          ) : appointments?.upcoming.length === 0 ? (
            <Card className="p-8 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma consulta agendada</h3>
              <p className="text-muted-foreground mb-4">
                Agende uma consulta com nossos profissionais
              </p>
              <Button onClick={() => setActiveTab('book')}>
                Agendar Consulta
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments?.upcoming.map((appointment) => (
                <Card key={appointment.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{appointment.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatAppointmentDate(appointment.appointment_date)}
                      </p>
                    </div>
                    <Badge className="bg-turquoise">{appointment.status}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    {formatAppointmentTime(appointment.appointment_date, appointment.duration)}
                  </div>

                  {appointment.healthcare_professionals && (
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <div className="text-sm">
                        <p className="font-medium">{appointment.healthcare_professionals.name}</p>
                        <p className="text-muted-foreground">
                          {appointment.healthcare_professionals.specialty}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {appointments?.past.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma consulta realizada ainda</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {appointments?.past.map((appointment) => (
                <Card key={appointment.id} className="p-6 opacity-75">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{appointment.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatAppointmentDate(appointment.appointment_date)}
                      </p>
                    </div>
                    <Badge variant="secondary">Concluída</Badge>
                  </div>

                  {appointment.healthcare_professionals && (
                    <div className="text-sm">
                      <p className="font-medium">{appointment.healthcare_professionals.name}</p>
                      <p className="text-muted-foreground">
                        {appointment.healthcare_professionals.specialty}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
