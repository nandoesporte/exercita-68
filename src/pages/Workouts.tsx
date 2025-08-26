
import React, { useState, useEffect } from 'react';
import { Search, Calendar } from 'lucide-react';
import { WorkoutCard } from '@/components/ui/workout-card';
import { useWorkoutCategories, useWorkoutsByDay, useRecommendedWorkoutsForUser } from '@/hooks/useWorkouts';
import { Database } from '@/integrations/supabase/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/auth/useAuth'; 

type Workout = Database['public']['Tables']['workouts']['Row'] & {
  category?: Database['public']['Tables']['workout_categories']['Row'] | null;
  days_of_week?: string[];
};

const weekdays = [
  { id: 'monday', label: 'Segunda' },
  { id: 'tuesday', label: 'Terça' },
  { id: 'wednesday', label: 'Quarta' },
  { id: 'thursday', label: 'Quinta' },
  { id: 'friday', label: 'Sexta' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' },
];

const Workouts = () => {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { session } = useAuth();
  const userId = session?.user?.id;
  
  // Obter treinos recomendados para o usuário
  const { data: userWorkouts, isLoading: isLoadingUserWorkouts } = useRecommendedWorkoutsForUser(userId);
  const { data: dayWorkouts, isLoading: isLoadingDayWorkouts } = useWorkoutsByDay(selectedDay);
  const { data: categories, isLoading: isLoadingCategories } = useWorkoutCategories();
  
  // Log para debug
  useEffect(() => {
    console.log(`UserId atual na tela Workouts: ${userId}`);
    console.log('Treinos recomendados na tela Workouts:', userWorkouts);
    if (selectedDay) {
      console.log('Treinos para o dia selecionado:', dayWorkouts);
    }
  }, [userId, userWorkouts, dayWorkouts, selectedDay]);
  
  // Determine quais treinos exibir com base no dia selecionado
  let workouts: Workout[] = [];
  
  if (selectedDay && dayWorkouts) {
    // Se um dia estiver selecionado, filtre os treinos do dia que também estão recomendados para o usuário
    workouts = dayWorkouts.filter(dayWorkout => 
      userWorkouts?.some(userWorkout => userWorkout.id === dayWorkout.id)
    );
    console.log(`Treinos filtrados para o dia ${selectedDay} e usuário ${userId}:`, workouts);
  } else {
    // Se nenhum dia estiver selecionado, mostre todos os treinos do usuário
    workouts = userWorkouts || [];
  }
    
  const isLoadingWorkouts = selectedDay 
    ? isLoadingDayWorkouts 
    : isLoadingUserWorkouts;
  
  // Combine built-in filters with category filters
  const filterCategories = ['Todos', 'Iniciante', 'Intermediário', 'Avançado', 'Rápido'];
  const allFilters = filterCategories.concat(
    categories?.map(c => c.name) || []
  ).filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
  
  // Filter workouts based on active filter and search query
  const filteredWorkouts = workouts?.filter((workout) => {
    let matchesFilter = true;
    
    // Handle special filters
    if (activeFilter === 'Todos') {
      matchesFilter = true;
    } else if (activeFilter === 'Iniciante') {
      matchesFilter = workout.level === 'beginner';
    } else if (activeFilter === 'Intermediário') {
      matchesFilter = workout.level === 'intermediate';
    } else if (activeFilter === 'Avançado') {
      matchesFilter = workout.level === 'advanced';
    } else if (activeFilter === 'Rápido') {
      matchesFilter = workout.duration < 30;
    } else {
      // Category filter
      matchesFilter = workout.category && workout.category.name === activeFilter;
    }
                          
    const matchesSearch = searchQuery === '' ||
      workout.title.toLowerCase().includes(searchQuery.toLowerCase());
                         
    return matchesFilter && matchesSearch;
  });

  const handleDayChange = (value: string) => {
    setSelectedDay(value === 'all' ? null : value);
  };

  return (
    <div className="container h-full">
      <section className="mobile-section h-full flex flex-col">
        {/* Weekly Schedule Selection - Responsive Design */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Calendar className="mr-2 h-4 w-4" />
            <h2 className="font-medium">Programação Semanal</h2>
          </div>
          
          {isMobile ? (
            /* Mobile View: Dropdown for days */
            <Select defaultValue="all" onValueChange={handleDayChange}>
              <SelectTrigger className="w-full bg-secondary text-foreground">
                <SelectValue placeholder="Selecionar dia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os dias</SelectItem>
                {weekdays.map((day) => (
                  <SelectItem key={day.id} value={day.id}>{day.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            /* Desktop View: Tabs for days */
            <Tabs defaultValue="all" onValueChange={handleDayChange} className="w-full">
              <TabsList className="flex w-full">
                <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
                {weekdays.map((day) => (
                  <TabsTrigger key={day.id} value={day.id} className="flex-1">
                    {day.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
      
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar treinos..."
            className="w-full pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-fitness-green text-black"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Category Filters - Scrollable container with better spacing for mobile */}
        <div className="flex overflow-x-auto gap-2 pb-3 mb-6 hide-scrollbar">
          {allFilters.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium flex-shrink-0 ${
                activeFilter === category
                  ? 'bg-fitness-green text-white'
                  : 'bg-secondary text-foreground'
              }`}
              onClick={() => setActiveFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        {/* Loading state */}
        {isLoadingWorkouts && (
          <div className="text-center py-12 flex-1 flex flex-col justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-green mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando treinos...</p>
          </div>
        )}
        
        {/* Workouts Grid */}
        {!isLoadingWorkouts && filteredWorkouts && filteredWorkouts.length > 0 ? (
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
              {filteredWorkouts.map((workout) => (
                <WorkoutCard 
                  key={workout.id} 
                  id={workout.id}
                  title={workout.title}
                  image={workout.image_url || ''}
                  duration={`${workout.duration} min`}
                  level={workout.level === 'beginner' ? 'Iniciante' : 
                         workout.level === 'intermediate' ? 'Intermediário' : 
                         workout.level === 'advanced' ? 'Avançado' : workout.level}
                  calories={workout.calories || 0}
                  daysOfWeek={workout.days_of_week}
                />
              ))}
            </div>
          </ScrollArea>
        ) : !isLoadingWorkouts && (
          <div className="text-center py-12 flex-1 flex flex-col justify-center">
            <p className="text-muted-foreground">Nenhum treino encontrado. Tente outra busca ou entre em contato com seu personal trainer.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Workouts;
