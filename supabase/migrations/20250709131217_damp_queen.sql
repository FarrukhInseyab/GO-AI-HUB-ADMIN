/*
  # Fix Conversion Timeline Function

  1. Purpose
    - Fix the conversion timeline function to properly track lead conversions
    - Ensure data is properly grouped by date
    - Fix ambiguous column references in SQL queries

  2. Changes
    - Rewrite get_conversion_timeline function with proper CTEs
    - Ensure proper date handling for timeline data
    - Fix column references in aggregation queries

  3. Security
    - Maintain existing security model
    - Function remains accessible to authorized users only
*/

-- Drop the existing function to avoid conflicts
DROP FUNCTION IF EXISTS get_conversion_timeline(integer);

-- Create improved function to get conversion timeline data
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
      CURRENT_DATE - (days_back || ' days')::interval,
      CURRENT_DATE,
      '1 day'::interval
    )::date AS date
  ),
  interest_counts AS (
    SELECT 
      date_trunc('day', created_at)::date AS count_date,
      COUNT(*) AS daily_total
    FROM interests
    WHERE created_at >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY count_date
  ),
  initiated_counts AS (
    SELECT 
      date_trunc('day', initiated_at)::date AS init_date,
      COUNT(*) AS daily_initiated
    FROM interests
    WHERE 
      initiated_at IS NOT NULL AND
      initiated_at >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY init_date
  ),
  converted_counts AS (
    SELECT 
      date_trunc('day', converted_at)::date AS conv_date,
      COUNT(*) FILTER (WHERE conversion_status = 'Lead Converted to Sales') AS daily_converted,
      COUNT(*) FILTER (WHERE conversion_status = 'Lead Not Converted to Sales') AS daily_not_converted
    FROM interests
    WHERE 
      converted_at IS NOT NULL AND
      converted_at >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY conv_date
  )
  SELECT 
    ds.date,
    COALESCE(ic.daily_total, 0)::bigint AS total_interests,
    COALESCE(init.daily_initiated, 0)::bigint AS leads_initiated,
    COALESCE(cc.daily_converted, 0)::bigint AS leads_converted,
    COALESCE(cc.daily_not_converted, 0)::bigint AS leads_not_converted,
    CASE 
      WHEN COALESCE(cc.daily_converted, 0) + COALESCE(cc.daily_not_converted, 0) > 0 
      THEN (COALESCE(cc.daily_converted, 0)::double precision / 
           (COALESCE(cc.daily_converted, 0) + COALESCE(cc.daily_not_converted, 0))::double precision) * 100
      ELSE 0
    END AS conversion_rate
  FROM date_series ds
  LEFT JOIN interest_counts ic ON ds.date = ic.count_date
  LEFT JOIN initiated_counts init ON ds.date = init.init_date
  LEFT JOIN converted_counts cc ON ds.date = cc.conv_date
  ORDER BY ds.date;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_conversion_timeline(integer) TO authenticated;

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'fix_conversion_timeline_function',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Fixed conversion timeline function to properly track lead conversions',
    'changes', jsonb_build_array(
      'Rewrote get_conversion_timeline function with proper CTEs',
      'Fixed date handling for timeline data',
      'Fixed ambiguous column references in aggregation queries'
    ),
    'security_level', 'MEDIUM'
  )
);