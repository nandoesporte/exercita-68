import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminWorkouts } from '@/hooks/useAdminWorkouts';
import { Loader2, Search, UserX, Users } from 'lucide-react';

export function QuickUserRecommendDialog({
  workoutId,
  workoutTitle,
  onClose,
}: {
  workoutId: string;
  workoutTitle?: string;
  onClose: () => void;
}) {
  const { 
    getWorkoutRecommendations,
    removeWorkoutRecommendation,
    isRemovingRecommendation,
    users
  } = useAdminWorkouts();
  
  // Get workout recommendations
  const { 
    data: recommendations, 
    isLoading: recommendationsLoading 
  } = getWorkoutRecommendations(workoutId);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Get users who have this workout recommended
  const recommendedUsers = users.filter(user => {
    return recommendations?.some(rec => rec.user_id === user.id);
  });

  // Filter recommended users based on search
  const filteredRecommendedUsers = recommendedUsers.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           (user.id && user.id.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  // Handle removing recommendation from a specific user
  const handleRemoveRecommendation = (userId: string) => {
    const recommendation = recommendations?.find(rec => rec.user_id === userId);
    if (recommendation) {
      removeWorkoutRecommendation({
        recommendationId: recommendation.id,
        workoutId
      });
    }
  };

  // Check if workout is recommended to all users
  const isRecommendedToAll = recommendations?.some(rec => rec.user_id === null);

  // Remove recommendation for all users
  const handleRemoveForAll = () => {
    const allUsersRecommendation = recommendations?.find(rec => rec.user_id === null);
    if (allUsersRecommendation) {
      removeWorkoutRecommendation({
        recommendationId: allUsersRecommendation.id,
        workoutId
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Remover Recomendações</DialogTitle>
          <DialogDescription>
            {workoutTitle && `Treino: ${workoutTitle}`}<br />
            Remova este treino das recomendações de usuários específicos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
          {isRecommendedToAll && (
            <div className="border rounded-lg p-3 bg-amber-50 border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Recomendado para Todos os Usuários</p>
                  <p className="text-xs text-muted-foreground">
                    Este treino está marcado como recomendação global
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveForAll}
                  disabled={isRemovingRecommendation}
                  className="border-amber-400 text-amber-600 hover:bg-amber-100"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Remover Global
                </Button>
              </div>
            </div>
          )}

          {recommendedUsers.length > 0 && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Buscar usuários recomendados..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <ScrollArea className="flex-1 border rounded-md">
                {recommendationsLoading ? (
                  <div className="p-4 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                  </div>
                ) : filteredRecommendedUsers.length > 0 ? (
                  <div className="p-0">
                    {filteredRecommendedUsers.map((user) => {
                      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                      const displayName = fullName || user.id;
                      
                      return (
                        <div 
                          key={user.id} 
                          className="flex items-center justify-between p-3 hover:bg-muted/50 border-b last:border-b-0"
                        >
                          <div>
                            <p className="text-sm font-medium">{displayName}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveRecommendation(user.id)}
                            disabled={isRemovingRecommendation}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "Nenhum usuário encontrado" : "Nenhuma recomendação específica"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </>
          )}

          {!isRecommendedToAll && recommendedUsers.length === 0 && (
            <div className="p-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Sem Recomendações Específicas</p>
              <p className="text-xs text-muted-foreground mt-1">
                Este treino não está recomendado para usuários específicos
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}