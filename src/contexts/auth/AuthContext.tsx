
import { createContext } from 'react';
import { User, Session } from '@supabase/supabase-js';

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string }) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  adminLogin: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// Create the context with undefined as default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
