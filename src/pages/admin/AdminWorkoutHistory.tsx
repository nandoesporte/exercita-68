import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, User, Calendar, Timer, Flame, Star, Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAdminWorkoutHistory } from "@/hooks/useAdminWorkoutHistory";
import { Skeleton } from "@/components/ui/skeleton";

const AdminWorkoutHistory = () => {
  const { data: workoutHistory, isLoading } = useAdminWorkoutHistory();
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar histórico baseado no termo de busca
  const filteredHistory = workoutHistory?.filter((item) => {
    const userName = `${item.user.first_name || ''} ${item.user.last_name || ''}`.toLowerCase().trim();
    const workoutTitle = item.workout.title.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return userName.includes(search) || workoutTitle.includes(search);
  }) || [];

  // Calcular estatísticas
  const totalWorkouts = workoutHistory?.length || 0;
  const uniqueUsers = new Set(workoutHistory?.map(item => item.user_id)).size;
  const totalCalories = workoutHistory?.reduce((sum, item) => sum + (item.calories_burned || 0), 0) || 0;
  const averageRating = workoutHistory?.length 
    ? workoutHistory.reduce((sum, item) => sum + (item.rating || 0), 0) / workoutHistory.filter(item => item.rating).length
    : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Histórico de Treinos dos Alunos</h1>
            <p className="text-muted-foreground">Acompanhe o progresso dos seus alunos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Treinos dos Alunos</h1>
          <p className="text-muted-foreground">Acompanhe o progresso dos seus alunos</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Trophy className="h-8 w-8 text-primary mr-4" />
            <div>
              <div className="text-2xl font-bold">{totalWorkouts}</div>
              <p className="text-xs text-muted-foreground">Total de Treinos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <div className="text-2xl font-bold">{uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">Alunos Ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Flame className="h-8 w-8 text-orange-500 mr-4" />
            <div>
              <div className="text-2xl font-bold">{totalCalories.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Calorias Queimadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Star className="h-8 w-8 text-yellow-500 mr-4" />
            <div>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Avaliação Média</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de busca */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno ou treino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Lista de histórico */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum treino encontrado</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm 
                  ? "Tente ajustar os filtros de busca"
                  : "Seus alunos ainda não completaram treinos"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredHistory.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Avatar do usuário */}
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={item.user.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {item.user.first_name} {item.user.last_name}
                        </h3>
                        <p className="text-primary font-medium mb-2">{item.workout.title}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(item.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                          
                          {item.duration && (
                            <div className="flex items-center gap-1">
                              <Timer className="h-4 w-4" />
                              {item.duration} min
                            </div>
                          )}
                          
                          {item.calories_burned && (
                            <div className="flex items-center gap-1">
                              <Flame className="h-4 w-4" />
                              {item.calories_burned} cal
                            </div>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-sm text-muted-foreground mb-2 italic">
                            "{item.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="capitalize">
                          {item.workout.level}
                        </Badge>
                        
                        {item.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{item.rating}/5</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminWorkoutHistory;