// Custom hook for interest-related operations
import { useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { supabase } from '../lib/supabase';
import emailService from '../utils/emailService';

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

    const result = await executeQuery(
      () => supabase
        .from('interests')
        .update(updates)
        .eq('id', interestId)
    );
    
    // If the update was successful and this is a lead initiation, send an email
    if (result.data && status === 'Lead Initiated') {
      try {
        // Get the full interest data with solution and evaluator info
        const { data: interestData } = await supabase
          .from('interests')
          .select(`
            *,
            solutions (
              solution_name,
              contact_email,
              contact_name
            ),
            users:Evaluator_id (
              contact_name,
              email
            )
          `)
          .eq('id', interestId)
          .single();
          
        if (interestData && interestData.solutions?.contact_email) {
          // Send email to solution owner
          await emailService.sendInterestSubmissionEmail(
            interestData.solutions.contact_email,
            interestData.solutions.contact_name,
            interestData.solutions.solution_name,
            interestData.company_name,
            interestData.message
          );
        }
        
        // If there's a contact email and an evaluator, send contact assignment email
        if (interestData && interestData.contact_email && interestData.users) {
          await emailService.sendContactAssignmentEmail(
            interestData.contact_email,
            interestData.contact_name,
            interestData.solutions?.solution_name || 'Solution',
            interestData.users.contact_name,
            interestData.users.email,
            comments || 'Your interest has been received and a contact person has been assigned to assist you.'
          );
        }
      } catch (error) {
        console.error('Error sending interest notification emails:', error);
      }
    }
    
    return result;
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