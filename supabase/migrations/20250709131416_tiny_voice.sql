/*
  # Fix Interest Stats Function

  1. Purpose
    - Fix the ambiguous column reference error in get_interest_stats function
    - Ensure proper data aggregation for conversion metrics
    - Maintain backward compatibility with existing code

  2. Changes
    - Drop existing function first to avoid return type errors
    - Recreate function with proper column qualification
    - Use CTEs for cleaner SQL organization
    - Fix ambiguous column references

  3. Security
    - Maintain SECURITY DEFINER setting
    - Grant proper permissions to authenticated users
*/

-- Drop the existing function to avoid return type errors
DROP FUNCTION IF EXISTS get_interest_stats();

-- Create the updated get_interest_stats function with proper column qualification
CREATE OR REPLACE FUNCTION get_interest_stats()
RETURNS TABLE(
  total_interests bigint,
  active_leads bigint,
  converted_leads bigint,
  not_converted_leads bigint,
  pending_conversion bigint,
  conversion_rate double precision,
  avg_response_time double precision,
  avg_conversion_time double precision,
  interests_by_company jsonb,
  conversion_timeline jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_res_time double precision := 0;
  responded_count bigint := 0;
  total_conv_time double precision := 0;
  converted_count bigint := 0;
  rec record;
BEGIN
  -- Get total interests count
  SELECT COUNT(*)::bigint INTO total_interests FROM public.interests;
  
  -- Get active leads count (initiated but not yet converted)
  SELECT COUNT(*)::bigint INTO active_leads 
  FROM public.interests 
  WHERE status = 'Lead Initiated' AND conversion_status IS NULL;
  
  -- Get converted leads count
  SELECT COUNT(*)::bigint INTO converted_leads
  FROM public.interests
  WHERE conversion_status = 'Lead Converted to Sales';
  
  -- Get not converted leads count
  SELECT COUNT(*)::bigint INTO not_converted_leads
  FROM public.interests
  WHERE conversion_status = 'Lead Not Converted to Sales';
  
  -- Get pending conversion count (initiated leads without conversion status)
  SELECT COUNT(*)::bigint INTO pending_conversion
  FROM public.interests
  WHERE status = 'Lead Initiated' AND conversion_status IS NULL;
  
  -- Calculate conversion rate
  IF (converted_leads + not_converted_leads) > 0 THEN
    conversion_rate := (converted_leads::double precision / (converted_leads + not_converted_leads)::double precision) * 100;
  ELSE
    conversion_rate := 0;
  END IF;
  
  -- Calculate average response time (interest to lead initiation)
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
  
  -- Calculate average conversion time (lead initiation to conversion)
  FOR rec IN 
    SELECT initiated_at, converted_at 
    FROM public.interests 
    WHERE converted_at IS NOT NULL AND initiated_at IS NOT NULL 
  LOOP
    total_conv_time := total_conv_time + (EXTRACT(EPOCH FROM (rec.converted_at - rec.initiated_at)) / 3600);
    converted_count := converted_count + 1;
  END LOOP;
  
  IF converted_count > 0 THEN
    avg_conversion_time := total_conv_time / converted_count;
  ELSE
    avg_conversion_time := NULL;
  END IF;
  
  -- Get top companies by interest count with proper column qualification
  WITH company_stats AS (
    SELECT 
      i.company_name, 
      COUNT(*)::bigint AS company_count,
      COUNT(*) FILTER (WHERE i.conversion_status = 'Lead Converted to Sales')::bigint AS company_converted_count
    FROM public.interests i
    GROUP BY i.company_name
    ORDER BY company_count DESC
    LIMIT 10
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'company', cs.company_name, 
      'count', cs.company_count,
      'converted', cs.company_converted_count,
      'conversion_rate', CASE WHEN cs.company_count > 0 
                             THEN (cs.company_converted_count::double precision / cs.company_count::double precision) * 100 
                             ELSE 0 
                        END
    )
  ) INTO interests_by_company
  FROM company_stats cs;
  
  -- Get conversion timeline (last 30 days) with proper column qualification
  WITH daily_conversions AS (
    SELECT 
      date_trunc('day', i.converted_at)::date AS conversion_date,
      COUNT(*) FILTER (WHERE i.conversion_status = 'Lead Converted to Sales')::bigint AS daily_converted_count,
      COUNT(*) FILTER (WHERE i.conversion_status = 'Lead Not Converted to Sales')::bigint AS daily_not_converted_count
    FROM public.interests i
    WHERE i.converted_at >= NOW() - INTERVAL '30 days'
      AND i.conversion_status IS NOT NULL
    GROUP BY conversion_date
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', dc.conversion_date,
      'converted', dc.daily_converted_count,
      'not_converted', dc.daily_not_converted_count
    ) ORDER BY dc.conversion_date
  ) INTO conversion_timeline
  FROM daily_conversions dc;
  
  RETURN NEXT;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_interest_stats() TO authenticated;

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'fix_interest_stats_function',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Fixed ambiguous column reference in get_interest_stats function',
    'changes', jsonb_build_array(
      'Fixed ambiguous column references by using table aliases',
      'Used CTEs for cleaner SQL organization',
      'Maintained backward compatibility with existing code'
    ),
    'security_level', 'MEDIUM'
  )
);