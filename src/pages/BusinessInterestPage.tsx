import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Activity, Mail, Calendar, MessageSquare, Building2, Search, Phone, Clock, TrendingUp, UserPlus, TrendingDown, DollarSign } from 'lucide-react';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Breadcrumb from '../components/ui/Breadcrumb';
import Input from '../components/ui/Input';
import InitiateContactDialog from '../components/business/InitiateContactDialog';
import ConversionStatusDialog from '../components/business/ConversionStatusDialog';
import ConversionMetrics from '../components/dashboard/ConversionMetrics';
import ConversionTimeline from '../components/dashboard/ConversionTimeline';

const BusinessInterestPage: React.FC = () => {
  const { refreshSession, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [interests, setInterests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [selectedInterestForConversion, setSelectedInterestForConversion] = useState<{
    id: string;
    companyName: string;
    solutionName: string;
  } | null>(null);
  const [stats, setStats] = useState({
    totalInterests: 0,
    activeLeads: 0,
    convertedLeads: 0,
    notConvertedLeads: 0,
    pendingConversion: 0,
    conversionRate: 0,
    avgResponseTime: null as number | null,
    avgConversionTime: null as number | null,
    interestsByCompany: [] as { company: string; count: number; converted: number; conversion_rate: number }[],
    interestsBySolution: [] as { solution: { id: string; name: string }; count: number; converted: number }[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get interest stats
      let { data: statsData, error: statsError } = await supabase.rpc('get_interest_stats');

      if (statsError?.message.includes('JWT expired')) {
        await refreshSession();
        ({ data: statsData, error: statsError } = await supabase.rpc('get_interest_stats'));
      }

      if (statsError) throw statsError;

      // Count new interests (with status 'New Interest')
      const { data: newInterestsData, error: newInterestsError } = await supabase
        .from('interests')
        .select('count', { count: 'exact' })
        .eq('status', 'New Interest');

      if (newInterestsError) throw newInterestsError;

      // Get interests data
      let { data: interestsData, error: interestsError } = await supabase
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
          users:user_id (
            id,
            contact_name,
            email,
            company_name
          ),
          evaluators:Evaluator_id (
            id,
            contact_name,
            email
          ),
          converters:converted_by (
            id,
            contact_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (interestsError) throw interestsError;

      // Extract stats from the RPC call
      const stats = statsData?.[0] || {
        total_interests: 0,
        active_leads: 0,
        converted_leads: 0,
        not_converted_leads: 0,
        pending_conversion: 0,
        conversion_rate: 0,
        avg_response_time: null,
        avg_conversion_time: null,
        interests_by_company: [],
        conversion_timeline: []
      };

      // Get the count of new interests
      const newInterestsCount = newInterestsData?.count || 0;

      // Get top solutions by interest
      const solutionInterests = interestsData?.reduce((acc: Record<string, { id: string; count: number; converted: number }>, interest) => {
        if (interest.solutions?.solution_name) {
          const key = interest.solutions.solution_name || 'Unknown Solution';
          if (!acc[key]) {
            acc[key] = { 
              id: interest.solutions.id, 
              count: 0,
              converted: 0
            };
          }
          acc[key].count++;
          
          // Count conversions
          if (interest.conversion_status === 'Lead Converted to Sales') {
            acc[key].converted++;
          }
        }
        return acc;
      }, {}) || {};

      const interestsBySolution = Object.entries(solutionInterests)
        .map(([name, { id, count, converted }]) => ({ 
          solution: { id, name },
          count,
          converted
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setInterests(interestsData || []);
      setStats({
        totalInterests: newInterestsCount,
        activeLeads: stats.active_leads,
        convertedLeads: stats.converted_leads,
        notConvertedLeads: stats.not_converted_leads,
        pendingConversion: stats.pending_conversion,
        conversionRate: stats.conversion_rate,
        avgResponseTime: stats.avg_response_time,
        avgConversionTime: stats.avg_conversion_time,
        interestsByCompany: stats.interests_by_company || [],
        interestsBySolution
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateConversionStatus = async (status: string, comments: string) => {
    if (!selectedInterestForConversion || !user || !supabase) return;

    try {
      const { error } = await supabase
        .from('interests')
        .update({
          conversion_status: status,
          conversion_comments: comments,
          converted_by: user.id,
          converted_at: new Date().toISOString()
        })
        .eq('id', selectedInterestForConversion.id);

      if (error) throw error;

      setSelectedInterestForConversion(null);
      fetchData();
    } catch (error) {
      console.error('Error updating conversion status:', error);
    }
  };

  const handleInitiateContact = async (interestId: string) => {
    setSelectedInterestId(interestId);
  };

  const handleConfirmContact = async (comments: string) => {
    if (!selectedInterestId || !user || !supabase) return;

    try {
      const { error } = await supabase
        .from('interests')
        .update({
          status: 'Lead Initiated',
          comments,
          Evaluator_id: user.id,
          initiated_at: new Date().toISOString()
        })
        .eq('id', selectedInterestId);

      if (error) throw error;

      setSelectedInterestId(null);
      fetchData();
    } catch (error) {
      console.error('Error updating interest status:', error);
    }
  };

  const formatResponseTime = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} ${t('common.minutes')}`;
    } else if (hours < 24) {
      return `${Math.round(hours)} ${t('common.hours')}`;
    } else {
      const days = Math.round(hours / 24);
      return `${days} ${t('common.days')}`;
    }
  };

  const getResponseTimeColor = (hours: number): string => {
    if (hours <= 2) return 'text-green-600'; // Excellent: <= 2 hours
    if (hours <= 24) return 'text-amber-600'; // Good: <= 24 hours
    return 'text-red-600'; // Needs improvement: > 24 hours
  };

  const filteredInterests = interests.filter(interest =>
    interest.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interest.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    interest.solutions?.solution_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const breadcrumbItems = [
    { label: t('businessInterest.title') }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-gradient flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <Breadcrumb items={breadcrumbItems} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary mt-4">{t('businessInterest.title')}</h1>
          <p className="text-white text-base sm:text-lg">{t('businessInterest.subtitle')}</p>
        </div>

        <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <ConversionMetrics 
            stats={{
              totalInterests: stats.totalInterests || 0,
              activeLeads: stats.activeLeads || 0,
              convertedLeads: stats.convertedLeads || 0,
              notConvertedLeads: stats.notConvertedLeads || 0,
              pendingConversion: stats.pendingConversion || 0,
              conversionRate: stats.conversionRate || 0,
              avgResponseTime: stats.avgResponseTime || null,
              avgConversionTime: stats.avgConversionTime || null
            }} 
          />
        </div>

        <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <ConversionTimeline />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
              <h3 className="text-lg font-semibold text-gradient-primary">{t('businessInterest.topInterestedCompanies')}</h3>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {stats.interestsByCompany.map(({ company, count, converted, conversion_rate }, index) => (
                  <div key={company} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-teal-50 hover:from-teal-50 hover:to-cyan-50 transition-all duration-200">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0 flex-1">
                      <span className="text-lg font-bold text-gradient-primary arabic-numerals flex-shrink-0">{index + 1}</span>
                      <span
                        className="text-teal-700 hover:text-teal-800 cursor-pointer font-medium transition-colors duration-200 truncate"
                        onClick={() => navigate(`/companies/${company}`)}
                      >
                        {company}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 rounded-full text-xs sm:text-sm font-medium flex-shrink-0">
                        <span className="arabic-numerals">{count}</span> {t('solutions.interests')}
                      </span>
                      <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-medium">
                        {converted} / {count} ({Math.round((converted / count) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
              <h3 className="text-lg font-semibold text-gradient-secondary">{t('businessInterest.mostInterestingSolutions')}</h3>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                {stats.interestsBySolution.map(({ solution, count, converted }, index) => (
                  <div key={solution.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-purple-50 hover:from-purple-50 hover:to-violet-50 transition-all duration-200">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0 flex-1">
                      <span className="text-lg font-bold text-gradient-secondary arabic-numerals flex-shrink-0">{index + 1}</span>
                      <span 
                        className="text-purple-700 hover:text-purple-800 cursor-pointer font-medium transition-colors duration-200 truncate"
                        onClick={() => navigate(`/business-solutions/${solution.id}`)}
                      >
                        {solution.name}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                      <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 rounded-full text-xs sm:text-sm font-medium flex-shrink-0">
                        <span className="arabic-numerals">{count}</span> {t('solutions.interests')}
                      </span>
                      {converted !== undefined && (
                        <span className="px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-medium">
                          {converted} / {count} ({Math.round((converted / count) * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              <h3 className="text-lg font-semibold text-gradient-primary">{t('businessInterest.businessInterests')}</h3>
              <Input
                placeholder={t('businessInterest.searchInterests')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="w-full sm:w-64"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredInterests.map((interest, index) => (
                <Card key={interest.id} className="bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300 hover:scale-105" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div 
                        className="text-teal-600 hover:text-teal-800 cursor-pointer font-semibold min-w-0 flex-1"
                        onClick={() => navigate(`/companies/${interest.company_name}`)}
                      >
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                          <span className="truncate">{interest.company_name}</span>
                        </div>
                      </div>
                      <span className={`
                        px-2 sm:px-3 py-1 text-xs font-medium rounded-full shadow-sm flex-shrink-0
                        ${interest.status === 'Lead Initiated' 
                          ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800' 
                          : 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800'}
                      `}>
                        {interest.status === 'Lead Initiated' ? t('businessInterest.leadInitiated') : t('businessInterest.newInterest')}
                      </span>
                    </div>

                    <div 
                      className="text-teal-600 hover:text-teal-800 cursor-pointer mb-3 font-medium truncate"
                      onClick={() => navigate(`/business-solutions/${interest.solution_id}`)}
                    >
                      {interest.solutions?.solution_name}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2 text-teal-500 flex-shrink-0" />
                        <span className="truncate">{new Date(interest.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1 text-teal-500 flex-shrink-0" />
                        <a 
                          href={`mailto:${interest.contact_email}`}
                          className="text-teal-600 hover:text-teal-800 truncate"
                        >
                          {interest.contact_email}
                        </a>
                      </div>
                      {interest.contact_phone && (
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Phone className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2 text-teal-500 flex-shrink-0" />
                          <span className="truncate">{interest.contact_phone}</span>
                        </div>
                      )}
                      {interest.status === 'Lead Initiated' && interest.created_at && interest.initiated_at && (
                        <div className="flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2 text-teal-500 flex-shrink-0" />
                          <span className={getResponseTimeColor(
                            (new Date(interest.initiated_at).getTime() - new Date(interest.created_at).getTime()) / (1000 * 60 * 60)
                          )}>
                            {t('businessInterest.responseTime')}: {formatResponseTime(
                              (new Date(interest.initiated_at).getTime() - new Date(interest.created_at).getTime()) / (1000 * 60 * 60)
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start mb-4">
                      <MessageSquare className="h-4 w-4 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 mt-1" />
                      <p className="text-sm text-gray-600 line-clamp-3">{interest.message}</p>
                    </div>

                    {interest.status === 'Lead Initiated' && interest.comments && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-teal-50 rounded-lg border border-teal-100">
                        <p className="text-sm text-gray-600 line-clamp-2">{interest.comments}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {t('businessInterest.leadInitiated')} {interest.evaluators?.contact_name || 'Unknown'} {t('common.created')}{' '}
                          {new Date(interest.initiated_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {interest.conversion_status && (
                      <div className={`mb-4 p-3 rounded-lg border ${
                        interest.conversion_status === 'Lead Converted to Sales' 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' 
                          : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-100'
                      }`}>
                        <div className="flex items-center mb-2">
                          {interest.conversion_status === 'Lead Converted to Sales' 
                            ? <TrendingUp className="h-4 w-4 text-green-600 mr-2" /> 
                            : <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
                          }
                          <span className="text-sm font-medium">{interest.conversion_status}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{interest.conversion_comments}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Updated by {interest.converters?.contact_name || 'Unknown'} on {new Date(interest.converted_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 rtl:space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Mail className="h-4 w-4" />}
                        onClick={() => window.location.href = `mailto:${interest.contact_email}`}
                        className="w-full sm:w-auto"
                      >
                        {t('common.contact')}
                      </Button>
                      {interest.status === 'Lead Initiated' && !interest.conversion_status && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedInterestForConversion({
                            id: interest.id,
                            companyName: interest.company_name,
                            solutionName: interest.solutions?.solution_name || 'Unknown Solution'
                          })}
                          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        >
                          Update Conversion Status
                        </Button>
                      )}
                      {interest.status !== 'Lead Initiated' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleInitiateContact(interest.id)}
                          className="w-full sm:w-auto"
                        >
                          {t('businessInterest.initiateContact')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <InitiateContactDialog
          isOpen={!!selectedInterestId}
          onClose={() => setSelectedInterestId(null)}
          onConfirm={handleConfirmContact}
        />

        <ConversionStatusDialog
          isOpen={!!selectedInterestForConversion}
          onClose={() => setSelectedInterestForConversion(null)}
          onConfirm={handleUpdateConversionStatus}
          interestId={selectedInterestForConversion?.id || ''}
          companyName={selectedInterestForConversion?.companyName || ''}
          solutionName={selectedInterestForConversion?.solutionName || ''}
        />
      </div>
    </div>
  );
};

export default BusinessInterestPage;