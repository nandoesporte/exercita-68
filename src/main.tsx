
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/auth'
import App from './App.tsx'
import './index.css'
import { Toaster } from 'sonner'
import { registerConnectivityListeners, registerInstallPrompt } from '@/utils/pwaUtils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Add type declaration for the global deferredPromptEvent
declare global {
  interface Window {
    deferredPromptEvent: any;
    queryClient: QueryClient; // Add proper type for queryClient
  }
}

// Create the query client outside the component to avoid re-creation on renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Default stale time of 0 to always fetch fresh data
      refetchOnWindowFocus: true, // Refetch data when window regains focus
      retry: 2, // Retry failed queries twice
      refetchOnReconnect: true, // Refetch when reconnecting
      refetchOnMount: true, // Refetch when component mounts
      gcTime: 1000 * 60 * 10, // Cache for 10 minutes (renamed from cacheTime)
    },
  },
});

// Make queryClient globally available for auth state change handling
window.queryClient = queryClient;

// Root component that wraps the application
const Main = () => {
  // Initialize PWA install prompt
  React.useEffect(() => {
    console.log('Registering PWA install prompt');
    registerInstallPrompt();
    
    // Log when PWA is installed
    const handleAppInstalled = () => {
      console.log('PWA was installed successfully');
      // Clear the deferred prompt when installed
      window.deferredPromptEvent = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Register listeners when component mounts
  React.useEffect(() => {
    const onlineCallback = () => {
      if (navigator.onLine) {
        import('sonner').then(({ toast }) => {
          toast.success('Conexão restabelecida.');
        });
      }
    };
    
    const offlineCallback = () => {
      if (!navigator.onLine) {
        import('sonner').then(({ toast }) => {
          toast.warning('Você está offline. Algumas funcionalidades podem não estar disponíveis.');
        });
      }
    };
    
    registerConnectivityListeners(onlineCallback, offlineCallback);

    // Check initial status
    if (!navigator.onLine) {
      import('sonner').then(({ toast }) => {
        toast.warning('Você está offline. Algumas funcionalidades podem não estar disponíveis.');
      });
    }

    return () => {
      // Listeners are properly removed in the pwaUtils function
    };
  }, []);

  return (
    <React.StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              {/* Single Toaster instance for the entire application */}
              <Toaster position="bottom-center" richColors closeButton />
              <App />
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

// Get the root element and create a root for it
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Create the root and render the app
createRoot(rootElement).render(<Main />);
