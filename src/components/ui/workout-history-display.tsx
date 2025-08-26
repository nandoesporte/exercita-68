import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Flame, Target, Trophy } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface WorkoutHistoryDisplayProps {
  workoutHistory?: Array<{
    id: string;
    completed_at: string;
    workout_id: string;
    user_id: string;
    workout?: {
      title: string;
      duration?: number;
    };
  }>;
}

export function WorkoutHistoryDisplay({ workoutHistory = [] }: WorkoutHistoryDisplayProps) {
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Processar dados do histórico
  const historyStats = useMemo(() => {
    if (!workoutHistory?.length) {
      return {
        completedDates: new Set<string>(),
        currentStreak: 0,
        totalThisMonth: 0,
        thisWeekCount: 0,
      };
    }

    const completedDates = new Set(
      workoutHistory.map(entry => 
        format(new Date(entry.completed_at), 'yyyy-MM-dd')
      )
    );

    // Calcular streak atual (dias consecutivos)
    let currentStreak = 0;
    let checkDate = new Date();
    
    while (completedDates.has(format(checkDate, 'yyyy-MM-dd'))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Treinos neste mês
    const totalThisMonth = workoutHistory.filter(entry => {
      const entryDate = new Date(entry.completed_at);
      return isSameMonth(entryDate, currentDate);
    }).length;

    // Treinos nesta semana
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const thisWeekCount = workoutHistory.filter(entry => {
      const entryDate = new Date(entry.completed_at);
      return isAfter(entryDate, weekStart);
    }).length;

    return {
      completedDates,
      currentStreak,
      totalThisMonth,
      thisWeekCount,
    };
  }, [workoutHistory, currentDate]);

  const getDayClasses = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd');
    const hasWorkout = historyStats.completedDates.has(dayString);
    const isCurrentDay = isToday(day);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isFutureDay = isAfter(day, currentDate);

    return cn(
      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200',
      {
        // Dia com treino
        'bg-fitness-green text-white shadow-lg scale-110': hasWorkout && isCurrentMonth,
        // Dia atual sem treino
        'bg-fitness-orange/20 text-fitness-orange border-2 border-fitness-orange': isCurrentDay && !hasWorkout && isCurrentMonth,
        // Dia atual com treino
        'bg-fitness-green text-white border-2 border-white shadow-lg': isCurrentDay && hasWorkout,
        // Dias normais do mês atual
        'text-white hover:bg-fitness-darkGray transition-colors': !hasWorkout && isCurrentMonth && !isCurrentDay && !isFutureDay,
        // Dias de outros meses
        'text-gray-500': !isCurrentMonth,
        // Dias futuros
        'text-gray-600': isFutureDay && isCurrentMonth,
      }
    );
  };

  return (
    <Card className="bg-fitness-darkGray border-none text-white">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-fitness-green/20 p-2 rounded-full">
              <Calendar className="h-4 w-4 text-fitness-green" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Meu Progresso</h3>
              <p className="text-xs text-gray-300">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-fitness-dark/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Flame className="h-4 w-4 text-fitness-orange" />
            </div>
            <div className="text-lg font-bold text-fitness-orange">
              {historyStats.thisWeekCount}
            </div>
            <div className="text-xs text-gray-400">treinos</div>
            <div className="text-xs text-gray-400">na semana</div>
          </div>

          <div className="bg-fitness-dark/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4 text-fitness-green" />
            </div>
            <div className="text-lg font-bold text-fitness-green">
              {historyStats.totalThisMonth}
            </div>
            <div className="text-xs text-gray-400">treinos</div>
            <div className="text-xs text-gray-400">no mês</div>
          </div>

          <div className="bg-fitness-dark/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Trophy className="h-4 w-4 text-fitness-blue" />
            </div>
            <div className="text-lg font-bold text-fitness-blue">
              {historyStats.currentStreak}
            </div>
            <div className="text-xs text-gray-400">dias</div>
            <div className="text-xs text-gray-400">seguidos</div>
          </div>
        </div>

        {/* Motivational message */}
        {historyStats.thisWeekCount > 0 && (
          <div className="bg-gradient-to-r from-fitness-green/20 to-fitness-orange/20 rounded-lg p-3 text-center">
            <p className="text-sm font-medium">
              🔥 Parabéns! Você treinou <span className="text-fitness-green font-bold">{historyStats.thisWeekCount} {historyStats.thisWeekCount === 1 ? 'dia' : 'dias'}</span> essa semana!
            </p>
          </div>
        )}

        {historyStats.thisWeekCount === 0 && historyStats.totalThisMonth === 0 && (
          <div className="bg-fitness-dark/50 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-300">
              Comece hoje e inicie sua jornada de transformação! 💪
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}