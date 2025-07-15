// Custom hook for solution-related operations
import { useState, useEffect, useCallback } from 'react';
import { Solution } from '../types';
import { useSupabase } from './useSupabase';
import { supabase } from '../lib/supabase';
import emailService from '../utils/emailService';

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
        .eq('id', id),
      {
        onSuccess: async (data) => {
          // If this is a new solution registration, send an email
          if (updates.status === 'pending' && data) {
            try {
              // Get the full solution data
              const { data: solutionData } = await supabase
                .from('solutions')
                .select('*')
                .eq('id', id)
                .single();
                
              if (solutionData && solutionData.contact_email) {
                await emailService.sendSolutionRegistrationEmail(
                  solutionData.contact_email,
                  solutionData.contact_name,
                  solutionData.solution_name,
                  id
                );
              }
            } catch (error) {
              console.error('Error sending solution registration email:', error);
            }
          }
        }
      }
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