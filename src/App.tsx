
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from '@/contexts/auth';
import { AdminPermissionsProvider } from '@/contexts/admin/AdminPermissionsContext';
import { Toaster } from '@/components/ui/sonner';
import { ReactQueryProvider } from '@/lib/react-query';
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/auth";

// Import layouts
import UserLayout from "@/components/layout/UserLayout";
import AdminLayout from "@/components/layout/AdminLayout";

// User pages
import Index from "@/pages/Index";
import Workouts from "@/pages/Workouts";
import WorkoutDetail from "@/pages/WorkoutDetail";
import History from "@/pages/History";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Store from "@/pages/Store";
import ProductDetail from "@/pages/ProductDetail";
import Schedule from "@/pages/Schedule";
import GymPhotos from "@/components/GymPhotos";
import Appointments from "@/pages/Appointments";

// Profile related pages
import AccountInfo from "@/pages/AccountInfo";
import Settings from "@/pages/Settings";
import WorkoutHistory from "@/pages/WorkoutHistory";
import Reminders from "@/pages/Reminders";
import Notifications from "@/pages/Notifications";
import PaymentMethods from "@/pages/PaymentMethods";
import InviteFriends from "@/pages/InviteFriends";
import HelpCenter from "@/pages/HelpCenter";

// Admin pages
import Dashboard from "@/pages/admin/Dashboard";
import ProtectedWorkoutManagement from "@/pages/admin/ProtectedWorkoutManagement";
import CreateWorkout from "@/pages/admin/CreateWorkout";
import EditWorkout from "@/pages/admin/EditWorkout";
import EditWorkoutExercises from "@/pages/admin/EditWorkoutExercises";
import ProtectedExerciseManagement from "@/pages/admin/ProtectedExerciseManagement";
import ProtectedProductManagement from "@/pages/admin/ProtectedProductManagement";
import ProtectedCategoryManagement from "@/pages/admin/ProtectedCategoryManagement";
import ExerciseCategoryManagement from "@/pages/admin/ExerciseCategoryManagement";
import CreateProduct from "@/pages/admin/CreateProduct";
import EditProduct from "@/pages/admin/EditProduct";
import ProtectedScheduleManagement from "@/pages/admin/ProtectedScheduleManagement";
import ProtectedPaymentMethodManagement from "@/pages/admin/ProtectedPaymentMethodManagement";
import ExerciseLibrary from "@/pages/admin/ExerciseLibrary";
import ProtectedGymPhotoManagement from "@/pages/admin/ProtectedGymPhotoManagement"; 
import UserManagement from "@/pages/admin/UserManagement";
import ProtectedAppointmentManagement from "@/pages/admin/ProtectedAppointmentManagement";
import SuperAdminDashboard from "@/pages/admin/SuperAdminDashboard";
import RLSChecker from "@/pages/admin/RLSChecker";
import AdminManagement from "@/pages/admin/AdminManagement";
import AdminPermissions from "@/pages/admin/AdminPermissions";
import SubscriptionManagement from "@/pages/admin/SubscriptionManagement";

const App = () => {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <AdminPermissionsProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* User Routes */}
            <Route element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Index />} />
              <Route path="/workouts" element={<Workouts />} />
              <Route path="/workout/:id" element={<WorkoutDetail />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/store" element={<Store />} />
              <Route path="/store/:id" element={<ProductDetail />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/gym-photos" element={<GymPhotos />} />
              <Route path="/appointments" element={<Appointments />} />
              
              {/* Profile related pages */}
              <Route path="/account" element={<AccountInfo />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/workout-history" element={<WorkoutHistory />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/payment" element={<PaymentMethods />} />
              <Route path="/invite" element={<InviteFriends />} />
              <Route path="/help" element={<HelpCenter />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute isAdminRoute={true}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              {/* Workouts */}
              <Route path="workouts" element={<ProtectedWorkoutManagement />} />
              <Route path="workouts/create" element={<CreateWorkout />} />
              <Route path="workouts/:id/edit" element={<EditWorkout />} />
              <Route path="workouts/:id/exercises" element={<EditWorkoutExercises />} />
              {/* Exercises */}
              <Route path="exercises" element={<ProtectedExerciseManagement />} />
              <Route path="exercises/library" element={<ExerciseLibrary />} />
              <Route path="exercises/categories" element={<ExerciseCategoryManagement />} />
              {/* Products */}
              <Route path="products" element={<ProtectedProductManagement />} />
              <Route path="products/create" element={<CreateProduct />} />
              <Route path="products/:id/edit" element={<EditProduct />} />
              {/* Categories */}
              <Route path="categories" element={<ProtectedCategoryManagement />} />
              {/* Photos */}
              <Route path="photos" element={<ProtectedGymPhotoManagement />} />
              {/* Scheduling */}
              <Route path="schedule" element={<ProtectedScheduleManagement />} />
              <Route path="appointments" element={<ProtectedAppointmentManagement />} />
              {/* Payment */}
              <Route path="payment-methods" element={<ProtectedPaymentMethodManagement />} />
              {/* Users */}
              <Route path="users" element={<UserManagement />} />
              {/* Admin Management */}
              <Route path="admins" element={<AdminManagement />} />
              {/* Super Admin Dashboard */}
              <Route path="super-dashboard" element={<SuperAdminDashboard />} />
              {/* RLS Checker */}
              <Route path="rls-checker" element={<RLSChecker />} />
              {/* Admin Permissions */}
              <Route path="permissions" element={<AdminPermissions />} />
              {/* Subscription Management */}
              <Route path="subscriptions" element={<SubscriptionManagement />} />
            </Route>
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AdminPermissionsProvider>
      </AuthProvider>
    </ReactQueryProvider>
  );
};

export default App;
