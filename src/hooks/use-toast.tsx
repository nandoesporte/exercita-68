
// Re-export from lib/toast-wrapper to avoid circular dependencies
export { toast } from "@/lib/toast-wrapper";
export type { Toast, ToastProps, ToastActionElement } from "@/components/ui/toast";

// Export the Toaster component for use in App.tsx
export { Toaster } from '@/components/ui/sonner';
