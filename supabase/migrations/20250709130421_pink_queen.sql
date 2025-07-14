/*
  # Fix ambiguous column reference in get_interest_stats function

  1. Function Updates
    - Drop and recreate `get_interest_stats` function
    - Fix ambiguous "converted_count" column reference by properly qualifying table aliases
    - Ensure all column references are unambiguous

  2. Changes Made
    - Properly alias all tables in the function
    - Qualify all column references with their respective table aliases
    - Fix the converted_count ambiguity issue
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_interest_stats();

-- Recreate the function with proper column qualification
CREATE OR REPLACE FUNCTION get_interest_stats()
RETURNS TABLE (
  total_interests bigint,
  active_leads bigint,
  converted_leads bigint,
  not_converted_leads bigint,
  pending_conversion bigint,
  conversion_rate numeric,
  avg_response_time numeric,
  avg_conversion_time numeric,
  interests_by_company jsonb,
  conversion_timeline jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH interest_stats AS (
    SELECT 
      COUNT(*) as total_count,
      COUNT(CASE WHEN i.status = 'Lead Initiated' THEN 1 END) as active_count,
      COUNT(CASE WHEN i.conversion_status = 'Lead Converted to Sales' THEN 1 END) as converted_count,
      COUNT(CASE WHEN i.conversion_status = 'Lead Not Converted to Sales' THEN 1 END) as not_converted_count,
      COUNT(CASE WHEN i.status = 'Lead Initiated' AND i.conversion_status IS NULL THEN 1 END) as pending_count,
      AVG(CASE 
        WHEN i.initiated_at IS NOT NULL AND i.created_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (i.initiated_at - i.created_at)) / 3600.0 
      END) as avg_response_hours,
      AVG(CASE 
        WHEN i.converted_at IS NOT NULL AND i.initiated_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (i.converted_at - i.initiated_at)) / 3600.0 
      END) as avg_conversion_hours
    FROM interests i
  ),
  company_stats AS (
    SELECT 
      i.company_name,
      COUNT(*) as interest_count,
      COUNT(CASE WHEN i.conversion_status = 'Lead Converted to Sales' THEN 1 END) as company_converted_count,
      CASE 
        WHEN COUNT(CASE WHEN i.status = 'Lead Initiated' THEN 1 END) > 0 
        THEN (COUNT(CASE WHEN i.conversion_status = 'Lead Converted to Sales' THEN 1 END)::numeric / COUNT(CASE WHEN i.status = 'Lead Initiated' THEN 1 END)::numeric) * 100
        ELSE 0 
      END as company_conversion_rate
    FROM interests i
    GROUP BY i.company_name
    ORDER BY interest_count DESC
    LIMIT 10
  ),
  timeline_stats AS (
    SELECT 
      DATE(i.created_at) as date,
      COUNT(*) as daily_interests,
      COUNT(CASE WHEN i.conversion_status = 'Lead Converted to Sales' THEN 1 END) as daily_conversions
    FROM interests i
    WHERE i.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(i.created_at)
    ORDER BY date DESC
  )
  SELECT 
    s.total_count::bigint,
    s.active_count::bigint,
    s.converted_count::bigint,
    s.not_converted_count::bigint,
    s.pending_count::bigint,
    CASE 
      WHEN s.active_count > 0 
      THEN ROUND((s.converted_count::numeric / s.active_count::numeric) * 100, 2)
      ELSE 0 
    END as conversion_rate,
    ROUND(s.avg_response_hours::numeric, 2) as avg_response_time,
    ROUND(s.avg_conversion_hours::numeric, 2) as avg_conversion_time,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'company', cs.company_name,
          'count', cs.interest_count,
          'converted', cs.company_converted_count,
          'conversion_rate', ROUND(cs.company_conversion_rate, 2)
        )
      )
      FROM company_stats cs
    ) as interests_by_company,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', ts.date,
          'interests', ts.daily_interests,
          'conversions', ts.daily_conversions
        )
      )
      FROM timeline_stats ts
    ) as conversion_timeline
  FROM interest_stats s;
END;
$$;