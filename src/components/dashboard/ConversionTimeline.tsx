import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingDown, Calendar, RefreshCw, Mail, Building2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

interface TimelineData {
  date: string;
  total_interests: number;
  leads_initiated: number;
  leads_converted: number;
  leads_not_converted: number;
  conversion_rate: number;
}

interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  status: string;
  conversion_status: string | null;
  created_at: string;
  initiated_at: string | null;
  converted_at: string | null;
  converted_by: string | null;
  evaluator: {
    contact_name: string;
  } | null;
  converter: {
    contact_name: string;
  } | null;
  solution_name: string;
}

const ConversionTimeline: React.FC = () => {
  const { t } = useTranslation();
  const { refreshSession } = useAuth();
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(30); // Default to 30 days
  const [displayDays, setDisplayDays] = useState<number>(14); // Default to showing 14 days
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimelineData();
    fetchLeads();
  }, [timeRange]);

  const fetchLeads = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    try {
      let { data, error } = await supabase
        .from('interests')
        .select(`
          id,
          company_name,
          contact_name,
          contact_email,
          status,
          conversion_status,
          created_at,
          initiated_at,
          converted_at,
          evaluator:Evaluator_id (
            contact_name
          ),
          converter:converted_by (
            contact_name
          ),
          converted_by,
          solutions (
            solution_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error?.message.includes('JWT expired')) {
        await refreshSession();
        ({ data, error } = await supabase
          .from('interests')
          .select(`
            id,
            company_name,
            contact_name,
            contact_email,
            status,
            conversion_status,
            created_at,
            initiated_at,
            converted_at,
            evaluator:Evaluator_id (
              contact_name
            ),
            converter:converted_by (
              contact_name
            ),
            solutions (
              solution_name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20));
      }

      if (error) throw error;
      
      const formattedLeads = data?.map(lead => ({
        ...lead,
        solution_name: lead.solutions?.solution_name || 'Unknown Solution'
      })) || [];
      
      setLeads(formattedLeads);
    } catch (error) {
      console.error('Error fetching leads data:', error);
    }
  };

  const fetchTimelineData = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Reset error state
      setError(null);
      setIsLoading(true);
      
      let { data, error } = await supabase.rpc('get_conversion_timeline', { days_back: timeRange });

      if (error?.message.includes('JWT expired')) {
        await refreshSession();
        ({ data, error } = await supabase.rpc('get_conversion_timeline', { days_back: timeRange }));
      }

      if (error) throw error;
      
      // Sort data by date in ascending order
      const sortedData = (data || []).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Take the most recent X days (based on displayDays)
      const recentData = sortedData.slice(-displayDays);
      
      setTimelineData(recentData);
    } catch (error) {
      console.error('Error fetching conversion timeline data:', error);
      setError('Failed to load timeline data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Find max value for scaling the bars
  const maxValue = Math.max(
    ...timelineData.map(d => Math.max(
      d.total_interests,
      d.leads_initiated,
      d.leads_converted,
      d.leads_not_converted
    )),
    1 // Ensure we have at least 1 to avoid division by zero
  );

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
          <h3 className="text-lg font-semibold text-gray-800 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            {t('businessInterest.conversionTimeline')}
          </h3>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 h-64 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading timeline data..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-teal-500 mr-2" />
            <h3 className="text-lg font-semibold text-gradient-primary">
              Lead Status Overview
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Data range:</span>
              <select
                className="border border-gray-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white min-w-[80px]"
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Display:</span>
              <select
                className="border border-gray-300 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white min-w-[80px]"
                value={displayDays}
                onChange={(e) => setDisplayDays(Number(e.target.value))}
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTimelineData}
              leftIcon={<RefreshCw className="h-4 w-4" />}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {error ? (
          <div className="text-center py-12 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl">
            <TrendingDown className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTimelineData}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Try Again
            </Button>
          </div>
        ) : timelineData.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-teal-50 rounded-xl">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No conversion data available for the selected time period.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lead Status Table */}
            <div className="bg-white p-4 rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solution</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.length > 0 ? (
                    leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{lead.company_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-700 truncate max-w-[150px] block">{lead.solution_name}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate max-w-[150px]">{lead.contact_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{new Date(lead.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            lead.status === 'Lead Initiated' 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {lead.status}
                          </span>
                          {lead.status === 'Lead Initiated' && lead.initiated_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(lead.initiated_at).toLocaleDateString()}
                              {lead.evaluator && (
                                <span className="ml-1">by {lead.evaluator.contact_name}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {lead.conversion_status ? (
                            <div>
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                lead.conversion_status === 'Lead Converted to Sales' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {lead.conversion_status === 'Lead Converted to Sales' ? 'Converted' : 'Not Converted'}
                              </span>
                              {lead.converted_at && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(lead.converted_at).toLocaleDateString()}
                                  {lead.converter && (
                                    <span className="ml-1">by {lead.converter.contact_name}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                        No leads data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="text-center text-xs text-gray-500 mt-2">
              Showing the most recent 20 leads. Use the controls above to adjust the data range.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversionTimeline;