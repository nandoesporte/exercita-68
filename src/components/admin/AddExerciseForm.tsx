
import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { WorkoutExercise } from '@/hooks/useAdminWorkouts';
import { toast } from '@/lib/toast';
import { ExerciseSelector } from '@/components/admin/ExerciseSelector';
import { useIsMobile } from '@/hooks/use-mobile';

interface Exercise {
  id: string;
  name: string;
  category_id?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
}

interface AddExerciseFormProps {
  exercises: Exercise[];
  onAddExercise: (exerciseData: WorkoutExercise) => void;
  currentExerciseCount: number;
  isLoading?: boolean;
}

const AddExerciseForm: React.FC<AddExerciseFormProps> = ({
  exercises,
  onAddExercise,
  currentExerciseCount,
  isLoading = false
}) => {
  const [selectedTab, setSelectedTab] = useState<'exercise' | 'title'>('exercise');
  const [exerciseId, setExerciseId] = useState<string>('');
  const [exerciseName, setExerciseName] = useState<string>('');
  const [sets, setSets] = useState<string>('3');
  const [reps, setReps] = useState<string>('12');
  const [duration, setDuration] = useState<string>('');
  const [durationUnit, setDurationUnit] = useState<'seconds' | 'minutes'>('seconds');
  const [rest, setRest] = useState<string>('30');
  const [weight, setWeight] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [sectionTitle, setSectionTitle] = useState<string>('');
  const isMobile = useIsMobile();

  const days = [
    { id: 'monday', name: 'Segunda-feira' },
    { id: 'tuesday', name: 'Terça-feira' },
    { id: 'wednesday', name: 'Quarta-feira' },
    { id: 'thursday', name: 'Quinta-feira' },
    { id: 'friday', name: 'Sexta-feira' },
    { id: 'saturday', name: 'Sábado' },
    { id: 'sunday', name: 'Domingo' },
    { id: 'all', name: 'Todos os dias' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTab === 'title') {
      // Add section title
      if (!sectionTitle.trim()) {
        toast.error('Digite um título para a seção');
        return;
      }

      if (selectedDays.length === 0) {
        toast.error('Selecione pelo menos um dia da semana');
        return;
      }

      // Create section titles for each selected day
      selectedDays.forEach((dayOfWeek) => {
        onAddExercise({
          is_title_section: true,
          section_title: sectionTitle.trim(),
          order_position: currentExerciseCount + 1,
          day_of_week: dayOfWeek === 'all' ? undefined : dayOfWeek,
        });
      });

      // Reset form
      setSectionTitle('');
      setSelectedDays([]);
      toast.success('Título de seção adicionado');
      return;
    }

    // Regular exercise validation
    if (!exerciseId) {
      toast.error('Selecione um exercício');
      return;
    }

    if (selectedDays.length === 0) {
      toast.error('Selecione pelo menos um dia da semana');
      return;
    }

    // Convert duration to seconds if it's in minutes
    let durationInSeconds = null;
    if (duration) {
      durationInSeconds = durationUnit === 'minutes' 
        ? parseInt(duration, 10) * 60 
        : parseInt(duration, 10);
    }

    // Add exercise for each selected day
    selectedDays.forEach((dayOfWeek) => {
      onAddExercise({
        exercise_id: exerciseId,
        sets: parseInt(sets, 10) || undefined,
        reps: reps ? parseInt(reps, 10) : null,
        duration: durationInSeconds,
        rest: rest ? parseInt(rest, 10) : null,
        weight: weight ? parseFloat(weight) : null,
        order_position: currentExerciseCount + 1,
        day_of_week: dayOfWeek === 'all' ? undefined : dayOfWeek,
      });
    });

    // Reset form
    setExerciseId('');
    setExerciseName('');
    setSelectedDays([]);
    toast.success('Exercício adicionado');
  };

  const handleExerciseSelect = (id: string, name: string) => {
    setExerciseId(id);
    setExerciseName(name);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'exercise' | 'title')}>
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="exercise">Exercício</TabsTrigger>
          <TabsTrigger value="title">Título de Seção</TabsTrigger>
        </TabsList>
      </Tabs>

      {selectedTab === 'title' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-title" className="flex items-center gap-1">
              <FileText className="h-4 w-4" /> Título da Seção
            </Label>
            <Input
              id="section-title"
              placeholder="Ex: Aquecimento, Parte Superior, etc."
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exercise">Exercício</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                {exerciseId ? (
                  <div className="border rounded-md p-2 flex items-center justify-between">
                    <span>{exerciseName}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setExerciseId('');
                        setExerciseName('');
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um exercício" />
                    </SelectTrigger>
                  </Select>
                )}
              </div>
              <ExerciseSelector
                onSelectExercise={handleExerciseSelect}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sets">Séries</Label>
              <Input
                id="sets"
                placeholder="Séries"
                type="number"
                min="0"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reps">Repetições</Label>
              <Input
                id="reps"
                placeholder="Repetições"
                type="number"
                min="0"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
          </div>

          {/* Enhanced Mobile Duration Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex flex-wrap items-center gap-1">
                <span>Duração</span>
                {isMobile && duration && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {durationUnit === 'minutes' ? 'minutos' : 'segundos'}
                  </span>
                )}
              </Label>
              <div className={`flex gap-2 ${isMobile ? 'relative' : ''}`}>
                <Input
                  id="duration"
                  placeholder="Duração"
                  type="number"
                  inputMode="numeric" 
                  pattern="[0-9]*"
                  min="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={`flex-1 ${isMobile && durationUnit === 'minutes' ? 'pr-16' : ''}`}
                />
                {isMobile ? (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="flex border rounded-md overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setDurationUnit('seconds')}
                        className={`px-2 py-1 text-xs transition-colors ${
                          durationUnit === 'seconds' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-background hover:bg-muted'
                        }`}
                      >
                        seg
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationUnit('minutes')}
                        className={`px-2 py-1 text-xs transition-colors ${
                          durationUnit === 'minutes' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-background hover:bg-muted'
                        }`}
                      >
                        min
                      </button>
                    </div>
                  </div>
                ) : (
                  <Select 
                    value={durationUnit} 
                    onValueChange={(value) => setDurationUnit(value as 'seconds' | 'minutes')}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Segundos</SelectItem>
                      <SelectItem value="minutes">Minutos</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rest">Descanso (segundos)</Label>
              <Input
                id="rest"
                placeholder="Descanso"
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                value={rest}
                onChange={(e) => setRest(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input
              id="weight"
              placeholder="Opcional"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="days">Dia da Semana</Label>
        <div className="grid grid-cols-1 gap-3 p-3 border rounded-md">
          {days.map((day) => (
            <div key={day.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`day-${day.id}`}
                checked={selectedDays.includes(day.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedDays([...selectedDays, day.id]);
                  } else {
                    setSelectedDays(selectedDays.filter(d => d !== day.id));
                  }
                }}
              />
              <label
                htmlFor={`day-${day.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {day.name}
              </label>
            </div>
          ))}
        </div>
        {selectedDays.length === 0 && (
          <p className="text-sm text-destructive">Selecione pelo menos um dia da semana</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adicionando...
          </span>
        ) : (
          selectedTab === 'title' ? 'Adicionar Título de Seção' : 'Adicionar Exercício'
        )}
      </Button>
    </form>
  );
};

export default AddExerciseForm;
