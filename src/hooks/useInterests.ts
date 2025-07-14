// Custom hook for interest-related operations
import { useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { supabase } from '../lib/supabase';

export const useInterests = () => {
  const [interests, setInterests] = useState<any[]>([]);
  const { executeQuery, isLoading, error } = useSupabase();

  const fetchInterestsBySolution = useCallback(async (solutionId: string) => {
    return executeQuery(
      () => supabase
        .from('interests')
        .select(`
          *,
          users:Evaluator_id (
            id,
            contact_name,
            email
          )
        `)
        .eq('solution_id', solutionId)
        .order('created_at', { ascending: false }),
      {
        onSuccess: (data) => setInterests(data || [])
      }
    );
  }, [executeQuery]);

  const fetchAllInterests = useCallback(async () => {
    return executeQuery(
      () => supabase
        .from('interests')
        .select(`
          *,
          solutions (
            id,
            solution_name,
            company_name,
            industry_focus,
            tech_categories
          ),
          users:Evaluator_id (
            id,
            contact_name,
            email
          )
        `)
        .order('created_at', { ascending: false }),
      {
        onSuccess: (data) => setInterests(data || [])
      }
    );
  }, [executeQuery]);

  const updateInterestStatus = useCallback(async (
    interestId: string, 
    status: string, 
    comments?: string,
    evaluatorId?: string
  ) => {
    const updates: any = {
      status,
      comments,
      Evaluator_id: evaluatorId
    };

    if (status === 'Lead Initiated') {
      updates.initiated_at = new Date().toISOString();
    }

    return executeQuery(
      () => supabase
        .from('interests')
        .update(updates)
        .eq('id', interestId)
    );
  }, [executeQuery]);

  return {
    interests,
    fetchInterestsBySolution,
    fetchAllInterests,
    updateInterestStatus,
    isLoading,
    error
  };
};