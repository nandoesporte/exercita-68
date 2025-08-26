
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Calendar as CalendarIcon, Clock, Dumbbell } from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Appointments = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const { data, isLoading, error } = useAppointments();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEE, d MMM');
    }
  };
  
  const formatTime = (dateString: string, durationMinutes: number) => {
    const startDate = new Date(dateString);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
  };
  
  const handleCancel = (appointmentId: string) => {
    toast.info("Cancellation feature coming soon!");
  };
  
  const handleReschedule = (appointmentId: string) => {
    toast.info("Reschedule feature coming soon!");
  };
  
  const handleBookAppointment = () => {
    toast.info("Booking feature coming soon!");
  };

  if (isLoading) {
    return (
      <>
        <Header title="Appointments" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-green"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="Appointments" />
        <div className="container p-4 text-center">
          <p className="text-red-500">Error loading appointments. Please try again later.</p>
        </div>
      </>
    );
  }

  const appointments = data?.upcoming || [];
  const pastAppointments = data?.past || [];

  return (
    <>
      <Header title="Appointments" />
      
      <main className="container">
        <section className="mobile-section">
          {/* Calendar Preview (simplified) */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{format(new Date(), 'MMMM yyyy')}</h3>
              <div className="flex gap-2">
                <button className="p-1 rounded hover:bg-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="p-1 rounded hover:bg-muted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Simplified calendar days */}
            <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-2">
              <div>S</div>
              <div>M</div>
              <div>T</div>
              <div>W</div>
              <div>T</div>
              <div>F</div>
              <div>S</div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => {
                // This is a simplified calendar just for UI purposes
                const day = i - 3; // Start from -3 to simulate a calendar month starting from Wednesday
                const today = new Date().getDate();
                const isToday = day === today;
                
                // Check if there are appointments on this day
                const hasAppointment = appointments.some(appointment => {
                  const appointmentDate = new Date(appointment.appointment_date);
                  return appointmentDate.getDate() === day && 
                         appointmentDate.getMonth() === new Date().getMonth();
                });
                
                const isCurrentMonth = day >= 1 && day <= 31;
                
                return (
                  <button
                    key={i}
                    className={`
                      h-8 w-8 rounded-full flex items-center justify-center text-sm
                      ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
                      ${isToday ? 'bg-fitness-green text-white' : ''}
                      ${hasAppointment && !isToday ? 'bg-fitness-green/20 text-fitness-green' : ''}
                    `}
                    disabled={!isCurrentMonth}
                  >
                    {isCurrentMonth ? day : ''}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'upcoming' 
                  ? 'border-b-2 border-fitness-green text-fitness-green' 
                  : 'text-muted-foreground'
              }`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'past' 
                  ? 'border-b-2 border-fitness-green text-fitness-green' 
                  : 'text-muted-foreground'
              }`}
              onClick={() => setActiveTab('past')}
            >
              Past
            </button>
          </div>
          
          {/* Appointments */}
          <div className="space-y-4">
            {activeTab === 'upcoming' ? (
              appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="fitness-card p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{formatDate(appointment.appointment_date)}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-fitness-green/20 text-fitness-green">
                        {appointment.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{appointment.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Clock size={14} />
                      <span>{formatTime(appointment.appointment_date, appointment.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Dumbbell size={14} />
                      <span>With {appointment.trainer_name}</span>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                      <button 
                        className="fitness-btn-secondary px-3 py-2 text-sm"
                        onClick={() => handleCancel(appointment.id)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="fitness-btn-primary px-3 py-2 text-sm"
                        onClick={() => handleReschedule(appointment.id)}
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 font-semibold">No upcoming appointments</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Schedule a workout session or class to get started.
                  </p>
                  <button 
                    className="fitness-btn-primary px-4 py-2 mt-4"
                    onClick={handleBookAppointment}
                  >
                    Book Appointment
                  </button>
                </div>
              )
            ) : (
              pastAppointments.length > 0 ? (
                pastAppointments.map((appointment) => (
                  <div key={appointment.id} className="fitness-card p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{formatDate(appointment.appointment_date)}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">
                        Completed
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{appointment.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Clock size={14} />
                      <span>{formatTime(appointment.appointment_date, appointment.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Dumbbell size={14} />
                      <span>With {appointment.trainer_name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No past appointments found.</p>
                </div>
              )
            )}
          </div>
          
          {/* Add Appointment Button */}
          <div className="fixed bottom-20 right-4 md:bottom-4">
            <button 
              className="h-14 w-14 rounded-full bg-fitness-green text-white flex items-center justify-center shadow-lg"
              onClick={handleBookAppointment}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </section>
      </main>
    </>
  );
};

export default Appointments;
