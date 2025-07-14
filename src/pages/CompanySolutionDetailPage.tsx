import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Globe, Users, Mail, FileText, Paperclip, Calendar, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Breadcrumb from '../components/ui/Breadcrumb';
import InitiateContactDialog from '../components/business/InitiateContactDialog';

const CompanySolutionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { refreshSession, user } = useAuth();
  const [solution, setSolution] = useState<any>(null);
  const [customerUser, setCustomerUser] = useState<any>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      let { data: solutionData, error: solutionError } = await supabase
        .from('solutions')
        .select('*')
        .eq('id', id)
        .single();

      if (solutionError?.message.includes('JWT expired')) {
        await refreshSession();
        ({ data: solutionData, error: solutionError } = await supabase
          .from('solutions')
          .select('*')
          .eq('id', id)
          .single());
      }

      if (solutionError) throw solutionError;

      // Fetch user data
      if (solutionData?.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', solutionData.user_id)
          .single();

        if (userError) throw userError;
        setCustomerUser(userData);
      }

      const { data: interestsData, error: interestsError } = await supabase
        .from('interests')
        .select(`
          *,
          users:Evaluator_id (
            id,
            contact_name,
            email
          )
        `)
        .eq('solution_id', id)
        .order('created_at', { ascending: false });

      if (interestsError) throw interestsError;

      setSolution(solutionData);
      setInterests(interestsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      fetchData();
    } catch (error) {
      console.error('Error updating interest status:', error);
    }
  };

  const getBreadcrumbItems = () => {
    const items = [
      { label: t('customers.title'), href: '/customers' }
    ];

    if (customerUser && solution) {
      items.push(
        { label: customerUser.company_name, href: `/customers/${solution.user_id}` },
        { label: solution.solution_name }
      );
    }

    return items;
  };

  const normalizeCategories = (categories: unknown): string[] => {
    if (Array.isArray(categories)) {
      return categories;
    }
    if (typeof categories === 'string') {
      return [categories];
    }
    return [];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-gradient flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="min-h-screen bg-app-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-teal-50 rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-slate-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gradient-primary mb-2">{t('solutions.solutionNotFound')}</h2>
            <p className="text-gray-500 mb-6">{t('solutions.solutionNotFoundDesc')}</p>
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

  const industryFocusList = normalizeCategories(solution.industry_focus);
  const techCategoriesList = normalizeCategories(solution.tech_categories);

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <Breadcrumb items={getBreadcrumbItems()} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary mt-4">{t('solutions.solutionDetails')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-gradient-primary line-clamp-2">{solution.solution_name}</h2>
                    <p className="text-gray-600 mt-1 line-clamp-2">{solution.summary}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {solution.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{solution.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-4">{t('solutions.companyInformation')}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                          <span 
                            className="text-teal-600 hover:text-teal-800 cursor-pointer transition-colors duration-200 truncate"
                            onClick={() => navigate(`/customers/${solution.user_id}`)}
                          >
                            {customerUser?.company_name || solution.company_name}
                          </span>
                        </div>
                        {solution.website && (
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                            <a href={solution.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 transition-colors duration-200 truncate">
                              {solution.website}
                            </a>
                          </div>
                        )}
                        {solution.employees && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                            <span className="text-gray-700 truncate"><span className="arabic-numerals">{solution.employees}</span> {t('solutions.employees')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-4">{t('solutions.contactInformation')}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-gray-700 truncate">{solution.contact_name}</span>
                            {solution.position && (
                              <span className="text-gray-500 ml-2 rtl:ml-0 rtl:mr-2 truncate">({solution.position})</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
                          <a href={`mailto:${solution.contact_email}`} className="text-teal-600 hover:text-teal-800 transition-colors duration-200 truncate">
                            {solution.contact_email}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{t('solutions.industryFocus')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {industryFocusList.map((industry, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 shadow-sm"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{t('solutions.technologyCategories')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {techCategoriesList.map((tech, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 shadow-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {solution.product_images && Array.isArray(solution.product_images) && solution.product_images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-4">{t('solutions.productImages')}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {solution.product_images.map((image: string, index: number) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-32 sm:h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {(solution.pitch_deck || solution.demo_video) && (
              <Card className="mt-6 shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <h3 className="text-lg font-semibold text-gradient-primary">{t('solutions.additionalResources')}</h3>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {solution.pitch_deck && (
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-teal-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg mr-3 rtl:mr-0 rtl:ml-3 shadow-md flex-shrink-0">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-gray-700 font-medium truncate">{t('solutions.pitchDeck')}</span>
                        </div>
                        <a
                          href={solution.pitch_deck}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 flex items-center transition-colors duration-200 flex-shrink-0"
                        >
                          <Paperclip className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                          {t('common.view')}
                        </a>
                      </div>
                    )}
                    
                    {solution.demo_video && (
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-teal-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg mr-3 rtl:mr-0 rtl:ml-3 shadow-md flex-shrink-0">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-gray-700 font-medium truncate">{t('solutions.demoVideo')}</span>
                        </div>
                        <a
                          href={solution.demo_video}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 flex items-center transition-colors duration-200 flex-shrink-0"
                        >
                          <Paperclip className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                          {t('common.view')}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gradient-primary">{t('businessInterest.businessInterests')}</h2>
                  <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-sm font-medium bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 rounded-full shadow-sm">
                    <span className="arabic-numerals">{interests.length}</span> {t('solutions.interests')}
                  </span>
                </div>
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
                          <div 
                            className="text-teal-600 hover:text-teal-800 cursor-pointer font-medium transition-colors duration-200 min-w-0 flex-1"
                            onClick={() => navigate(`/customers/${interest.user_id}`)}
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
                              : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800'}
                          `}>
                            {interest.status === 'Lead Initiated' ? t('businessInterest.leadInitiated') : t('businessInterest.newInterest')}
                          </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1 text-teal-500 flex-shrink-0" />
                          <span className="truncate">{new Date(interest.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Mail className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1 text-teal-500 flex-shrink-0" />
                          <a 
                            href={`mailto:${interest.contact_email}`}
                            className="text-teal-600 hover:text-teal-800 transition-colors duration-200 truncate"
                          >
                            {interest.contact_email}
                          </a>
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

export default CompanySolutionDetailPage;