
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import MobileNavbar from './MobileNavbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

const UserLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();
  const { showInstallPrompt, showPrompt, closePrompt } = usePWAInstall();
  
  useEffect(() => {
    // Show PWA install prompt after 3 seconds if conditions are met
    const timer = setTimeout(() => {
      if (isMobile) {
        showPrompt();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isMobile, showPrompt]);
  
  // Determine the header title based on the current route
  const getHeaderTitle = () => {
    switch (true) {
      case currentPath === '/profile':
        return 'Perfil';
      case currentPath === '/workouts':
        return 'Treinos';
      case currentPath === '/history':
        return 'Histórico';
      case currentPath === '/store':
        return 'Loja';
      case currentPath === '/schedule':
        return 'Agendar';
      case currentPath.startsWith('/workout/'):
        return ''; // Return empty title for workout detail pages
      case currentPath === '/':
        return 'Início';
      default:
        return '';
    }
  };
  
  // Check if we're on a workout detail page
  const isWorkoutDetailPage = currentPath.startsWith('/workout/');
  
  return (
    <div 
      className="flex flex-col bg-fitness-dark text-white"
      style={{ 
        minHeight: isMobile ? '100dvh' : '100vh',
        height: isMobile ? '100dvh' : 'auto'
      }}
    >
      {/* Header is controlled within each workout detail page */}
      {!isWorkoutDetailPage && <Header title={getHeaderTitle()} />}
      
      <main className={`flex-1 container max-w-7xl mx-auto px-4 py-3 pb-20 md:pb-8 animate-fade-in ${isWorkoutDetailPage ? 'pt-0' : ''}`}>
        <Outlet />
      </main>
      
      <MobileNavbar />
      
      {/* PWA Install Prompt */}
      {showInstallPrompt && <PWAInstallPrompt onClose={closePrompt} />}
    </div>
  );
};

export default UserLayout;
