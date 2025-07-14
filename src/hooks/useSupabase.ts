// Custom hook for Supabase operations with error handling and loading states
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface UseSupabaseOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useSupabase = () => {
  const { refreshSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async (
    queryFn: () => Promise<any>,
    options: UseSupabaseOptions = {}
  ) => {
    if (!supabase) {
      const error = new Error('Supabase client not available');
      setError(error.message);
      options.onError?.(error);
      return { data: null, error };
    }

    setIsLoading(true);
    setError(null);

    try {
      let result = await queryFn();

      // Handle JWT expiration
      if (result.error?.message.includes('JWT expired')) {
        await refreshSession();
        result = await queryFn();
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      options.onSuccess?.(result.data);
      return { data: result.data, error: null };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      options.onError?.(err);
      return { data: null, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [refreshSession]);

  return {
    executeQuery,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};