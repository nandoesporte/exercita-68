
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Dumbbell, History, User, ShoppingBag, Calendar, Camera, Activity, Zap, Salad } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserPersonalizedWorkout } from '@/hooks/useWorkoutHistory';

const MobileNavbar = () => {
  const location = useLocation();
  const { data: personalizedWorkoutId, isLoading } = useUserPersonalizedWorkout();
  
  // Determine which workout to link to
  let workoutLink = '/workouts'; // Default to workouts page if no specific workout is available
  
  if (personalizedWorkoutId) {
    // Use the personalized workout if available
    workoutLink = `/workout/${personalizedWorkoutId}`;
  }
  
  const navItems = [
    { icon: Home, path: '/', label: 'Início' },
    { icon: Dumbbell, path: workoutLink, label: 'Treinos' },
    { icon: Salad, path: '/nutrition', label: 'Nutrição' },
    { icon: ShoppingBag, path: '/store', label: 'Loja' },
    { icon: User, path: '/profile', label: 'Perfil' },
  ];

  // Don't show mobile navbar in admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-fitness-dark/95 backdrop-blur-md border-t border-fitness-darkGray/50 z-50 px-2 py-1 md:hidden animate-slide-up">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {navItems.map((item) => {
          // Special case for Treinos, Store, and Nutrição paths
          let isActive = false;
          if (item.label === 'Treinos') {
            isActive = location.pathname.startsWith('/workout/');
          } else if (item.label === 'Loja') {
            isActive = location.pathname.startsWith('/store');
          } else if (item.label === 'Nutrição') {
            isActive = location.pathname.startsWith('/nutrition');
          } else {
            isActive = location.pathname === item.path;
          }
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-200 active:scale-95",
                isActive 
                  ? "text-turquoise bg-turquoise/10 glow-turquoise" 
                  : "text-gray-200 hover:text-turquoise hover:bg-turquoise/5"
              )}
            >
              <item.icon size={22} className={cn("mb-1", isActive ? "text-turquoise" : "text-gray-300")} />
              <span className="text-sm font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavbar;
