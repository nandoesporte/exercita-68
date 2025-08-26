import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useWorkouts } from '@/hooks/useWorkouts';
import { ExercitaLogo } from '@/components/ui/exercita-logo';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showBack?: boolean;
  onBackClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showSearch = false,
  showNotifications = true,
  showBack = false,
  onBackClick
}) => {
  const isMobile = useIsMobile();
  // Use safe fallbacks in case auth is still initializing
  const { profile, isLoading: profileLoading } = useProfile();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const location = useLocation();
  const { data: workouts } = useWorkouts();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  
  // Update avatar URL when profile changes, with stable cache busting
  useEffect(() => {
    if (profile?.avatar_url && !imageError) {
      try {
        // Use a stable URL per profile update to prevent re-renders
        if (profile.avatar_url.includes('?')) {
          // Already has parameters, keep as is
          setAvatarUrl(profile.avatar_url);
        } else {
          // Add timestamp parameter if not present
          setAvatarUrl(`${profile.avatar_url}?t=${Date.now()}`);
        }
        console.log('Header: Avatar URL set:', avatarUrl);
      } catch (e) {
        console.error('Header: Erro ao processar URL do avatar:', e);
        setAvatarUrl(profile.avatar_url); // Fallback to original URL on error
      }
    } else {
      setAvatarUrl(null);
    }
  }, [profile?.avatar_url, imageError]);
  
  // Find the first workout to link to, or use a fallback
  const firstWorkoutId = workouts && workouts.length > 0 
    ? workouts[0].id 
    : 'default';
  
  // Check if we're on a workout detail page to hide the header
  const isWorkoutDetailPage = location.pathname.startsWith('/workout/');
  const isHomePage = location.pathname === '/';
  
  // Don't render anything on workout detail pages
  if (isWorkoutDetailPage) {
    return null;
  }
  
  const getInitials = () => {
    if (!profile) return 'U';
    
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const handleImageError = () => {
    console.error('Error loading header avatar image');
    setImageError(true);
  };

  // If auth is loading, show a simplified header to prevent errors
  if (authLoading) {
    return (
      <header className="sticky top-0 z-40 w-full bg-fitness-dark/95 backdrop-blur-lg border-b border-fitness-darkGray/50">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <ExercitaLogo width={40} height={40} />
            <span className="font-extrabold text-xl text-white">Exercita</span>
          </div>
          <div className="animate-pulse w-8 h-8 bg-fitness-darkGray rounded-full"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-fitness-dark/95 backdrop-blur-lg border-b border-fitness-darkGray/50">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <button 
              onClick={onBackClick} 
              className="p-2 rounded-full hover:bg-fitness-darkGray/60 active:scale-95 transition-all"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M19 12H5M5 12L12 19M5 12L12 5" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          {!isMobile && title && (
            <h1 className="text-xl font-bold text-white">{title}</h1>
          )}
        </div>
        
        {/* App Logo for Mobile (centered) */}
        <div className={`absolute left-1/2 transform -translate-x-1/2 flex items-center ${!isMobile && 'hidden'}`}>
          <Link to="/" className="flex items-center gap-2">
            <ExercitaLogo width={40} height={40} />
            <span className="font-extrabold text-xl text-white">Exercita</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <ExercitaLogo width={40} height={40} />
                <span className="font-extrabold text-xl text-white">Exercita</span>
              </Link>
              
              <nav className="flex items-center ml-6 space-x-4">
                <Link 
                  to="/" 
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/' 
                     ? 'text-primary bg-fitness-darkGray/30' 
                       : 'text-muted-foreground hover:text-white hover:bg-fitness-darkGray/20'
                  }`}
                >
                  Início
                </Link>
                <Link 
                  to={`/workout/${firstWorkoutId}`}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname.startsWith('/workout/') 
                     ? 'text-primary bg-fitness-darkGray/30' 
                       : 'text-muted-foreground hover:text-white hover:bg-fitness-darkGray/20'
                  }`}
                >
                  Treinos
                </Link>
                <Link 
                  to="/schedule"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/schedule' 
                     ? 'text-primary bg-fitness-darkGray/30' 
                       : 'text-muted-foreground hover:text-white hover:bg-fitness-darkGray/20'
                  }`}
                >
                  Agendar
                </Link>
                <Link 
                  to="/store"
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname.startsWith('/store') 
                     ? 'text-primary bg-fitness-darkGray/30' 
                       : 'text-muted-foreground hover:text-white hover:bg-fitness-darkGray/20'
                  }`}
                >
                  Loja
                </Link>
                <Link 
                  to="/history" 
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === '/history' 
                     ? 'text-primary bg-fitness-darkGray/30' 
                       : 'text-muted-foreground hover:text-white hover:bg-fitness-darkGray/20'
                  }`}
                >
                  Histórico
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      location.pathname.startsWith('/admin') 
                       ? 'text-primary bg-fitness-darkGray/30' 
                         : 'text-muted-foreground hover:text-white hover:bg-fitness-darkGray/20'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </nav>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          {showNotifications && (
            <Link to="/notifications" className="p-2 rounded-full hover:bg-fitness-darkGray/60 active:scale-95 transition-all text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            </Link>
          )}
          
          {/* Profile Icon - hidden on home page */}
          {!isHomePage && (
            <Link 
              to="/profile" 
              className="p-1 rounded-full hover:bg-fitness-darkGray/60 active:scale-95 transition-all"
            >
              <Avatar className="h-8 w-8 border-2 border-primary">
                {avatarUrl ? (
                  <AvatarImage 
                    src={avatarUrl} 
                    alt={`${profile?.first_name || 'Usuário'}'s profile`}
                    onError={handleImageError}
                  />
                ) : null}
                <AvatarFallback className="bg-fitness-dark text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
