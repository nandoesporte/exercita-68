
import React, { useState } from 'react';
import { ArrowLeft, Clock, Plus, Trash2, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Reminder {
  id: string;
  time: string;
  days: string[];
  active: boolean;
}

const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      time: '07:00',
      days: ['seg', 'qua', 'sex'],
      active: true,
    },
    {
      id: '2',
      time: '18:30',
      days: ['ter', 'qui'],
      active: false,
    },
  ]);

  const daysOfWeek = [
    { key: 'dom', label: 'D' },
    { key: 'seg', label: 'S' },
    { key: 'ter', label: 'T' },
    { key: 'qua', label: 'Q' },
    { key: 'qui', label: 'Q' },
    { key: 'sex', label: 'S' },
    { key: 'sab', label: 'S' },
  ];

  const addNewReminder = () => {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      time: '08:00',
      days: [],
      active: true,
    };
    setReminders([...reminders, newReminder]);
    toast.success("Novo lembrete adicionado. Defina os dias e horário.");
  };

  const toggleReminderActive = (reminderId: string, active: boolean) => {
    setReminders(
      reminders.map((reminder) =>
        reminder.id === reminderId ? { ...reminder, active } : reminder
      )
    );
    toast.success(active ? "Lembrete ativado" : "Lembrete desativado");
  };

  const deleteReminder = (reminderId: string) => {
    setReminders(reminders.filter((reminder) => reminder.id !== reminderId));
    toast.success("Lembrete removido");
  };

  const toggleDay = (reminderId: string, day: string) => {
    setReminders(
      reminders.map((reminder) => {
        if (reminder.id === reminderId) {
          const days = reminder.days.includes(day)
            ? reminder.days.filter((d) => d !== day)
            : [...reminder.days, day];
          return { ...reminder, days };
        }
        return reminder;
      })
    );
  };

  const updateTime = (reminderId: string, time: string) => {
    setReminders(
      reminders.map((reminder) =>
        reminder.id === reminderId ? { ...reminder, time } : reminder
      )
    );
  };

  return (
    <main className="container">
      <section className="mobile-section">
        <div className="mb-6 flex items-center">
          <Link to="/profile" className="mr-2">
            <ArrowLeft className="text-fitness-orange" />
          </Link>
          <h1 className="text-2xl font-bold">Lembretes de Treino</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-fitness-darkGray p-4 rounded-lg">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-fitness-orange mr-2" />
              <p className="text-sm">
                Configure lembretes para não perder seus treinos. Os lembretes serão enviados como notificações push no seu dispositivo.
              </p>
            </div>
          </div>

          {reminders.map((reminder) => (
            <div key={reminder.id} className="bg-fitness-darkGray p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-fitness-orange mr-2" />
                  <input
                    type="time"
                    value={reminder.time}
                    onChange={(e) => updateTime(reminder.id, e.target.value)}
                    className="bg-transparent border-none text-lg font-bold focus:outline-none focus:ring-0"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={reminder.active}
                    onCheckedChange={(checked) => toggleReminderActive(reminder.id, checked)}
                  />
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex justify-between space-x-1">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.key}
                    onClick={() => toggleDay(reminder.id, day.key)}
                    className={`flex-1 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium ${
                      reminder.days.includes(day.key)
                        ? 'bg-fitness-orange text-white'
                        : 'bg-fitness-dark text-gray-400'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <Button
            onClick={addNewReminder}
            className="w-full bg-fitness-darkGray hover:bg-fitness-dark border border-dashed border-gray-600 flex items-center justify-center gap-2 py-6"
          >
            <Plus size={20} />
            <span>Adicionar novo lembrete</span>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Reminders;
