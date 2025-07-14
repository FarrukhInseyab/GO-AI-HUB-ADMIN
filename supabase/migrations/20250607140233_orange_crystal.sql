/*
  # Create Dashboard and Interest Statistics Functions

  1. New Functions
    - `get_dashboard_stats()` - Returns solution statistics by approval status
    - `get_interest_stats()` - Returns interest statistics including response times

  2. Purpose
    - Provides optimized aggregation queries for dashboard metrics
    - Calculates average response times for interest management
    - Returns top companies and solutions by interest count

  3. Security
    - Functions are accessible to authenticated users
    - No RLS policies needed as these are aggregate statistics
*/

-- Create function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE(
  total bigint,
  pending bigint,
  in_review bigint,
  approved bigint,
  rejected bigint,
  needs_clarification bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint AS total,
    COUNT(*) FILTER (
      WHERE (tech_approval_status IS NULL OR tech_approval_status = 'pending') 
        AND (business_approval_status IS NULL OR business_approval_status = 'pending')
    )::bigint AS pending,
    COUNT(*) FILTER (
      WHERE (tech_approval_status = 'in_review' OR business_approval_status = 'in_review')
        AND NOT (tech_approval_status = 'approved' AND business_approval_status = 'approved')
        AND NOT (tech_approval_status = 'rejected' OR business_approval_status = 'rejected')
        AND NOT (tech_approval_status = 'needs_clarification' OR business_approval_status = 'needs_clarification')
    )::bigint AS in_review,
    COUNT(*) FILTER (
      WHERE tech_approval_status = 'approved' AND business_approval_status = 'approved'
    )::bigint AS approved,
    COUNT(*) FILTER (
      WHERE tech_approval_status = 'rejected' OR business_approval_status = 'rejected'
    )::bigint AS rejected,
    COUNT(*) FILTER (
      WHERE tech_approval_status = 'needs_clarification' OR business_approval_status = 'needs_clarification'
    )::bigint AS needs_clarification
  FROM public.solutions;
END;
$$;

-- Create function to get interest statistics
CREATE OR REPLACE FUNCTION get_interest_stats()
RETURNS TABLE(
  total_interests bigint,
  active_leads bigint,
  avg_response_time double precision,
  interests_by_company jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_res_time double precision := 0;
  responded_count bigint := 0;
  rec record;
BEGIN
  -- Get total interests count
  SELECT COUNT(*)::bigint INTO total_interests FROM public.interests;
  
  -- Get active leads count
  SELECT COUNT(*)::bigint INTO active_leads 
  FROM public.interests 
  WHERE status = 'Lead Initiated';
  
  -- Calculate average response time
  FOR rec IN 
    SELECT created_at, initiated_at 
    FROM public.interests 
    WHERE initiated_at IS NOT NULL AND created_at IS NOT NULL 
  LOOP
    total_res_time := total_res_time + (EXTRACT(EPOCH FROM (rec.initiated_at - rec.created_at)) / 3600);
    responded_count := responded_count + 1;
  END LOOP;
  
  IF responded_count > 0 THEN
    avg_response_time := total_res_time / responded_count;
  ELSE
    avg_response_time := NULL;
  END IF;
  
  -- Get top companies by interest count
  SELECT jsonb_agg(
    jsonb_build_object(
      'company', company_name, 
      'count', count
    )
  ) INTO interests_by_company
  FROM (
    SELECT company_name, COUNT(*)::bigint AS count
    FROM public.interests
    GROUP BY company_name
    ORDER BY count DESC
    LIMIT 5
  ) AS top_companies;
  
  RETURN NEXT;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_interest_stats() TO authenticated;