// Custom hook for solution-related operations
import { useState, useEffect, useCallback } from 'react';
import { Solution } from '../types';
import { useSupabase } from './useSupabase';
import { supabase } from '../lib/supabase';

export const useSolutions = () => {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const { executeQuery, isLoading, error } = useSupabase();

  const fetchSolutions = useCallback(async () => {
    const result = await executeQuery(
      () => supabase
        .from('solutions')
        .select('*')
        .order('created_at', { ascending: false }),
      {
        onSuccess: (data) => setSolutions(data || [])
      }
    );
    return result;
  }, [executeQuery]);

  const fetchSolutionById = useCallback(async (id: string) => {
    return executeQuery(
      () => supabase
        .from('solutions')
        .select('*')
        .eq('id', id)
        .single()
    );
  }, [executeQuery]);

  const updateSolution = useCallback(async (id: string, updates: Partial<Solution>) => {
    return executeQuery(
      () => supabase
        .from('solutions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
    );
  }, [executeQuery]);

  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);

  return {
    solutions,
    fetchSolutions,
    fetchSolutionById,
    updateSolution,
    isLoading,
    error
  };
};