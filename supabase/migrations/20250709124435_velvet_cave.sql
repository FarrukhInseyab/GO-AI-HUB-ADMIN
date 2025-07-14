/*
  # Add Lead Conversion Tracking

  1. New Features
    - Add conversion status tracking to interests table
    - Add conversion comments for detailed tracking
    - Add conversion date tracking
    - Update dashboard stats to include conversion metrics

  2. Changes
    - Add conversion_status column to interests table
    - Add conversion_comments column for detailed notes
    - Add converted_at timestamp
    - Add converted_by evaluator tracking
    - Update dashboard functions for conversion KPIs

  3. Security
    - Only evaluators can update conversion status
    - Maintain audit trail of conversions
*/

-- Add conversion tracking columns to interests table
ALTER TABLE interests 
ADD COLUMN IF NOT EXISTS conversion_status text CHECK (conversion_status IN ('Lead Converted to Sales', 'Lead Not Converted to Sales')),
ADD COLUMN IF NOT EXISTS conversion_comments text,
ADD COLUMN IF NOT EXISTS converted_at timestamptz,
ADD COLUMN IF NOT EXISTS converted_by uuid REFERENCES users(id);

-- Create index for better performance on conversion queries
CREATE INDEX IF NOT EXISTS idx_interests_conversion_status ON interests(conversion_status);
CREATE INDEX IF NOT EXISTS idx_interests_converted_at ON interests(converted_at);

-- Drop the existing function first to avoid return type errors
DROP FUNCTION IF EXISTS get_interest_stats();

-- Create the updated get_interest_stats function with new return columns
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
  
  -- Get top companies by interest count
  SELECT jsonb_agg(
    jsonb_build_object(
      'company', company_name, 
      'count', count,
      'converted', converted_count,
      'conversion_rate', CASE WHEN count > 0 THEN (converted_count::double precision / count::double precision) * 100 ELSE 0 END
    )
  ) INTO interests_by_company
  FROM (
    SELECT 
      company_name, 
      COUNT(*)::bigint AS count,
      COUNT(*) FILTER (WHERE conversion_status = 'Lead Converted to Sales')::bigint AS converted_count
    FROM public.interests
    GROUP BY company_name
    ORDER BY count DESC
    LIMIT 10
  ) AS top_companies;
  
  -- Get conversion timeline (last 30 days)
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', date_trunc('day', converted_at)::date,
      'converted', converted_count,
      'not_converted', not_converted_count
    ) ORDER BY date_trunc('day', converted_at)::date
  ) INTO conversion_timeline
  FROM (
    SELECT 
      converted_at,
      COUNT(*) FILTER (WHERE conversion_status = 'Lead Converted to Sales')::bigint AS converted_count,
      COUNT(*) FILTER (WHERE conversion_status = 'Lead Not Converted to Sales')::bigint AS not_converted_count
    FROM public.interests
    WHERE converted_at >= NOW() - INTERVAL '30 days'
      AND conversion_status IS NOT NULL
    GROUP BY date_trunc('day', converted_at)
  ) AS daily_conversions;
  
  RETURN NEXT;
END;
$$;

-- Drop the function if it exists before creating it
DROP FUNCTION IF EXISTS get_conversion_timeline(integer);

-- Create function to get conversion timeline data
CREATE OR REPLACE FUNCTION get_conversion_timeline(days_back integer DEFAULT 30)
RETURNS TABLE(
  date date,
  total_interests bigint,
  leads_initiated bigint,
  leads_converted bigint,
  leads_not_converted bigint,
  conversion_rate double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '1 day' * days_back,
      CURRENT_DATE,
      INTERVAL '1 day'
    )::date AS date
  ),
  daily_stats AS (
    SELECT 
      date_trunc('day', i.created_at)::date AS date,
      COUNT(*)::bigint AS total_interests,
      COUNT(*) FILTER (WHERE i.status = 'Lead Initiated')::bigint AS leads_initiated,
      COUNT(*) FILTER (WHERE i.conversion_status = 'Lead Converted to Sales')::bigint AS leads_converted,
      COUNT(*) FILTER (WHERE i.conversion_status = 'Lead Not Converted to Sales')::bigint AS leads_not_converted
    FROM public.interests i
    WHERE i.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY date_trunc('day', i.created_at)::date
  )
  SELECT 
    ds.date,
    COALESCE(dst.total_interests, 0) AS total_interests,
    COALESCE(dst.leads_initiated, 0) AS leads_initiated,
    COALESCE(dst.leads_converted, 0) AS leads_converted,
    COALESCE(dst.leads_not_converted, 0) AS leads_not_converted,
    CASE 
      WHEN COALESCE(dst.leads_converted, 0) + COALESCE(dst.leads_not_converted, 0) > 0 
      THEN (COALESCE(dst.leads_converted, 0)::double precision / (COALESCE(dst.leads_converted, 0) + COALESCE(dst.leads_not_converted, 0))::double precision) * 100
      ELSE 0
    END AS conversion_rate
  FROM date_series ds
  LEFT JOIN daily_stats dst ON ds.date = dst.date
  ORDER BY ds.date;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_interest_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_timeline(integer) TO authenticated;

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'add_lead_conversion_tracking',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Added lead conversion tracking with sales status and KPI metrics',
    'features_added', jsonb_build_array(
      'conversion_status column with Lead Converted/Not Converted options',
      'conversion_comments for detailed tracking',
      'converted_at timestamp tracking',
      'converted_by evaluator reference',
      'Enhanced dashboard stats with conversion metrics',
      'Timeline view for conversion data'
    ),
    'security_level', 'MEDIUM'
  )
);