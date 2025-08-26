
import { useAuth as useContextAuth } from '@/contexts/auth';

/**
 * Hook para acessar as funções de autenticação em qualquer componente.
 * Este hook é um wrapper sobre o useAuth do contexto para facilitar a migração
 * de código e manter compatibilidade com importações existentes.
 */
export function useAuth() {
  return useContextAuth();
}
