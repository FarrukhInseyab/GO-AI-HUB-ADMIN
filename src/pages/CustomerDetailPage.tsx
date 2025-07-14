import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Globe, Mail, Calendar, MessageSquare, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import SubmissionCard from '../components/submissions/SubmissionCard';
import Breadcrumb from '../components/ui/Breadcrumb';
import InitiateContactDialog from '../components/business/InitiateContactDialog';

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { refreshSession, user } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInterests: 0,
    activeLeads: 0,
    totalSolutions: 0
  });

  useEffect(() => {
    if (id) {
      fetchCustomerData();
    }
  }, [id]);

  const fetchCustomerData = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch user/customer data
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (userError?.message.includes('JWT expired')) {
        await refreshSession();
        ({ data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single());
      }

      if (userError) throw userError;

      // Fetch solutions by this user
      const { data: solutionsData, error: solutionsError } = await supabase
        .from('solutions')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (solutionsError) throw solutionsError;

      // Fetch interests by this user
      const { data: interestsData, error: interestsError } = await supabase
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
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (interestsError) throw interestsError;

      // Calculate stats
      const totalInterests = interestsData?.length || 0;
      const activeLeads = interestsData?.filter(i => i.status === 'Lead Initiated').length || 0;
      const totalSolutions = solutionsData?.length || 0;

      setCustomer(userData);
      setSolutions(solutionsData || []);
      setInterests(interestsData || []);
      setStats({ totalInterests, activeLeads, totalSolutions });
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setIsLoading(false);
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
      fetchCustomerData();
    } catch (error) {
      console.error('Error updating interest status:', error);
    }
  };

  const getBreadcrumbItems = () => {
    const items = [
      { label: t('customers.title'), href: '/customers' }
    ];

    if (customer) {
      items.push({ label: customer.company_name });
    }

    return items;
  };

  const handleSolutionClick = (solutionId: string) => {
    navigate(`/customer/solutions/${solutionId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-gradient flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-app-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-teal-50 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-slate-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gradient-primary mb-2">{t('customers.customerNotFound')}</h2>
            <p className="text-gray-500 mb-6">{t('customers.customerNotFoundDesc')}</p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/customers')}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {t('customers.backToCustomers')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <Breadcrumb items={getBreadcrumbItems()} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary mt-4">{t('customers.customerDetails')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-gradient-primary truncate">{customer.company_name}</h1>
                    <p className="text-gray-600 mt-1 truncate">{customer.contact_name}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="text-teal-600 text-sm font-medium">{t('businessInterest.totalInterests')}</div>
                    <div className="text-xl sm:text-2xl font-bold text-gradient-primary arabic-numerals">{stats.totalInterests}</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="text-emerald-600 text-sm font-medium">{t('businessInterest.activeLeads')}</div>
                    <div className="text-xl sm:text-2xl font-bold text-gradient-secondary arabic-numerals">{stats.activeLeads}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="text-purple-600 text-sm font-medium">{t('solutions.title')}</div>
                    <div className="text-xl sm:text-2xl font-bold text-gradient-secondary arabic-numerals">{stats.totalSolutions}</div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                      <a 
                        href={`mailto:${customer.email}`}
                        className="text-teal-600 hover:text-teal-800 transition-colors duration-200 truncate"
                      >
                        {customer.email}
                      </a>
                    </div>

                    {/* Display country */}
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                      <span className="text-gray-700 truncate">{customer.country || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                      <span className="text-gray-700 truncate">
                        {t('customers.joined')} {new Date(customer.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {solutions.length > 0 && (
              <div className="mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-xl font-semibold text-gradient-primary mb-4">{t('solutions.title')}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {solutions.map((solution, index) => (
                    <div 
                      key={solution.id} 
                      onClick={() => handleSolutionClick(solution.id)} 
                      className="cursor-pointer animate-fade-in-up"
                      style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                    >
                      <SubmissionCard solution={solution} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <h2 className="text-lg font-semibold text-gradient-primary">{t('customers.businessInterestHistory')}</h2>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {interests.length > 0 ? (
                    interests.map((interest, index) => (
                      <div 
                        key={interest.id} 
                        className="p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-100 hover:border-teal-200 transition-all duration-300 hover:shadow-lg animate-fade-in-up"
                        style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-2 sm:space-y-0">
                          <h3 
                            className="text-teal-600 hover:text-teal-800 cursor-pointer font-medium transition-colors duration-200 truncate"
                            onClick={() => navigate(`/customer/solutions/${interest.solution_id}`)}
                          >
                            {interest.solutions?.solution_name}
                          </h3>
                          <span className={`
                            px-2 sm:px-3 py-1 text-xs font-medium rounded-full shadow-sm flex-shrink-0
                            ${interest.status === 'Lead Initiated' 
                              ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800' 
                              : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800'}
                          `}>
                            {interest.status === 'Lead Initiated' ? t('businessInterest.leadInitiated') : t('businessInterest.newInterest')}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1 text-teal-500 flex-shrink-0" />
                          <span className="truncate">{new Date(interest.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-start mb-3">
                          <MessageSquare className="h-4 w-4 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 mt-1 flex-shrink-0" />
                          <p className="text-sm text-gray-600 line-clamp-3">{interest.message}</p>
                        </div>

                        {interest.status === 'Lead Initiated' && interest.comments && (
                          <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-teal-50 rounded-lg border border-teal-100">
                            <p className="text-sm text-gray-600 line-clamp-3">{interest.comments}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {t('businessInterest.leadInitiated')} {interest.users?.contact_name || 'Unknown'} {t('common.created')}{' '}
                              {new Date(interest.initiated_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 rtl:space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Mail className="h-4 w-4" />}
                            onClick={() => window.location.href = `mailto:${interest.contact_email}`}
                            className="w-full sm:w-auto"
                          >
                            {t('common.contact')}
                          </Button>
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
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-teal-50 rounded-lg">
                      <p className="text-gray-500">{t('businessInterest.noInterestsYet')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <InitiateContactDialog
          isOpen={!!selectedInterestId}
          onClose={() => setSelectedInterestId(null)}
          onConfirm={handleConfirmContact}
        />
      </div>
    </div>
  );
};

export default CustomerDetailPage;