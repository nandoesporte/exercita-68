
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { Menu, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';

const SIDEBAR_WIDTH_MOBILE = "85vw";

const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  // Add extra protection to make sure only admins can access this layout
  useEffect(() => {
    if (!loading && !isAdmin) {
      console.log('Non-admin trying to access admin layout, redirecting to home');
      navigate('/', { replace: true });
    }
  }, [isAdmin, navigate, loading]);

  // Get current page title from path
  const getCurrentPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/admin') return 'Dashboard';
    
    // Extract the last part of the path
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 1) {
      // Capitalize first letter and replace hyphens with spaces
      const lastSegment = segments[segments.length - 1];
      return lastSegment.charAt(0).toUpperCase() + 
             lastSegment.slice(1).replace(/-/g, ' ');
    }
    
    return 'Admin';
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleCloseSidebar = () => {
    setOpen(false);
  };

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fitness-green"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background m-0 p-0 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64">
        <AdminSidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border h-20 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-6 w-full">
            {/* Mobile navigation */}
            <div className="flex items-center gap-3 md:hidden">
              {location.pathname !== '/admin' && (
                <Button variant="ghost" size="icon" onClick={handleBackClick} className="mr-2 touch-target">
                  <ArrowLeft size={24} />
                </Button>
              )}
              
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden touch-target-large">
                    <Menu size={28} />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[85vw]" style={{ maxWidth: SIDEBAR_WIDTH_MOBILE }}>
                  <AdminSidebar onNavItemClick={handleCloseSidebar} />
                </SheetContent>
              </Sheet>
            </div>
            
            {/* App logo and title */}
            <div className="flex items-center gap-4 w-full justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src="/lovable-uploads/abe8bbb7-7e2f-4277-b5b0-1f923e57b6f7.png"
                  alt="Mais Saúde Logo"
                  className="h-10 w-10"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-lg md:text-xl">Mais Saúde</span>
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">
                    {getCurrentPageTitle()}
                  </span>
                </div>
              </div>
              
              {/* Current page title and home button (mobile only) */}
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="default"
                  asChild
                  className="hidden sm:flex"
                >
                  <Link to="/">
                    <Home className="h-5 w-5 mr-2" />
                    Início
                  </Link>
                </Button>
                
                <div className="md:hidden text-base font-medium">
                  {getCurrentPageTitle()}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto admin-section">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
