import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, MessageSquare, Mail, Building2, Brain, Zap, Globe, Users, FileText, Paperclip, MapPin, DollarSign, TrendingUp, Shield, Wrench, CheckCircle, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { Solution } from '../types';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import InitiateContactDialog from '../components/business/InitiateContactDialog';
import AIRecommendationDialog from '../components/ai/AIRecommendationDialog';
import OpenAIDialog from '../components/ai/OpenAIDialog';
import TextArea from '../components/ui/TextArea';
import { getSolutionStatus } from '../utils/helpers';
import Breadcrumb from '../components/ui/Breadcrumb';

const EvaluatorSolutionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { refreshSession, user } = useAuth();
  const { t } = useTranslation();
  const [solution, setSolution] = useState<Solution | null>(null);
  const [interests, setInterests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(null);
  const [showAIRecommendationDialog, setShowAIRecommendationDialog] = useState(false);
  const [showOpenAIDialog, setShowOpenAIDialog] = useState(false);
  const [techVoteStatus, setTechVoteStatus] = useState<string | null>(null);
  const [businessVoteStatus, setBusinessVoteStatus] = useState<string | null>(null);
  const [techFeedback, setTechFeedback] = useState('');
  const [businessFeedback, setBusinessFeedback] = useState('');
  const [techEvaluator, setTechEvaluator] = useState<any>(null);
  const [businessEvaluator, setBusinessEvaluator] = useState<any>(null);

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
      
      // Fetch solution details
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

      // Set feedback from solution data
      setTechFeedback(solutionData.tech_feedback || '');
      setBusinessFeedback(solutionData.business_feedback || '');

      // Fetch evaluators
      if (solutionData.technical_eval_id) {
        const { data: techData } = await supabase
          .from('users')
          .select('contact_name')
          .eq('id', solutionData.technical_eval_id)
          .single();
        setTechEvaluator(techData);
      }

      if (solutionData.business_eval_id) {
        const { data: businessData } = await supabase
          .from('users')
          .select('contact_name')
          .eq('id', solutionData.business_eval_id)
          .single();
        setBusinessEvaluator(businessData);
      }

      // Fetch interests for this solution
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

  const handleVote = async (type: 'technical' | 'business', status: string, feedback?: string) => {
    if (!solution || !user || !supabase) return;

    try {
      const updates: Partial<Solution> = {
        updated_at: new Date().toISOString()
      };

      if (type === 'technical') {
        updates.tech_approval_status = status;
        updates.tech_feedback = feedback;
        updates.technical_eval_id = user.id;
      } else {
        updates.business_approval_status = status;
        updates.business_feedback = feedback;
        updates.business_eval_id = user.id;
      }

      // Update main status based on new approval statuses
      const newTechStatus = type === 'technical' ? status : solution.tech_approval_status;
      const newBusinessStatus = type === 'business' ? status : solution.business_approval_status;
      
      if (newTechStatus === 'approved' && newBusinessStatus === 'approved') {
        updates.status = 'approved';
        updates.approved_at = new Date().toISOString();
      } else if (newTechStatus === 'rejected' || newBusinessStatus === 'rejected') {
        updates.status = 'rejected';
      } else {
        updates.status = 'pending';
      }

      const { error } = await supabase
        .from('solutions')
        .update(updates)
        .eq('id', solution.id);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Error updating solution:', error);
    }
  };

  const handleResubmit = async () => {
    if (!solution || !supabase) return;

    try {
      const updates: Partial<Solution> = {
        status: 'resubmit',
        tech_approval_status: 'pending',
        business_approval_status: 'pending',
        tech_feedback: '',
        business_feedback: '',
        technical_eval_id: null,
        business_eval_id: null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('solutions')
        .update(updates)
        .eq('id', solution.id);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Error resubmitting solution:', error);
    }
  };

  const handleTechVote = (status: string) => {
    setTechVoteStatus(status);
    if (techFeedback.trim()) {
      handleVote('technical', status, techFeedback);
      setTechVoteStatus(null);
    }
  };
  
  const handleBusinessVote = (status: string) => {
    setBusinessVoteStatus(status);
    if (businessFeedback.trim()) {
      handleVote('business', status, businessFeedback);
      setBusinessVoteStatus(null);
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

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return <span className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">Pending</span>;
      case 'in_review':
        return <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">In Review</span>;
      case 'approved':
        return <span className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">Approved</span>;
      case 'rejected':
        return <span className="bg-gradient-to-r from-red-100 to-rose-100 text-red-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">Rejected</span>;
      case 'needs_clarification':
        return <span className="bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">Needs Clarification</span>;
      case 'resubmit':
        return <span className="bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">Resubmit</span>;
      default:
        return <span className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm">N/A</span>;
    }
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

  const normalizeClients = (clients: unknown): string[] => {
    if (Array.isArray(clients)) {
      return clients;
    }
    if (typeof clients === 'string') {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(clients);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return [clients]; // If parsed but not array, treat as single string
      } catch {
        // If JSON parsing fails, treat as single string
        return [clients];
      }
    }
    return [];
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'N/A';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return 'N/A';
      }
    }
    return String(value);
  };

  const canResubmit = solution && (
    getSolutionStatus(solution) === 'rejected' || 
    solution.tech_approval_status === 'needs_clarification' || 
    solution.business_approval_status === 'needs_clarification'
  );

  const getBreadcrumbItems = () => {
    return [
      { label: t('dashboard.title'), href: '/' },
      { label: solution?.solution_name || 'Solution Details' }
    ];
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
            <h2 className="text-xl font-semibold text-gradient-primary mb-2">Solution Not Found</h2>
            <p className="text-gray-500 mb-6">The solution you're looking for doesn't exist or has been removed.</p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/')}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="hidden sm:inline">GO.Ai | رُوَّاد</span> GPT-4
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const industryFocusList = normalizeCategories(solution.industry_focus);
  const techCategoriesList = normalizeCategories(solution.tech_categories);
  const autoTagsList = normalizeCategories(solution.auto_tags);
  const clientsList = normalizeClients(solution.clients);

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <Breadcrumb items={getBreadcrumbItems()} />
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 space-y-4 sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary">Solution Details</h1>
            <div className="flex flex-wrap gap-3">
              {canResubmit && (
                <Button
                  variant="warning"
                  leftIcon={<RotateCcw className="h-5 w-5" />}
                  onClick={handleResubmit}
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Resubmit
                </Button>
              )}
              <Button
                variant="outline"
                leftIcon={<Brain className="h-5 w-5" />}
                onClick={() => setShowAIRecommendationDialog(true)}
                className="border-teal-300 text-teal-700 hover:bg-teal-50 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="hidden sm:inline">GO.Ai | رُوَّاد</span> Analysis
              </Button>
              <Button
                variant="primary"
                leftIcon={<Zap className="h-5 w-5" />}
                onClick={() => setShowOpenAIDialog(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span className="hidden sm:inline">GO.Ai | رُوَّاد</span> GPT-4
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {/* Basic Information */}
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-gradient-primary line-clamp-2">{formatValue(solution.solution_name)}</h2>
                    <p className="text-gray-600 mt-1 line-clamp-2">{formatValue(solution.summary)}</p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Technical:</span>
                      {getStatusBadge(solution.tech_approval_status)}
                      {techEvaluator && (
                        <span className="text-xs text-gray-500 hidden sm:inline">by {techEvaluator.contact_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Business:</span>
                      {getStatusBadge(solution.business_approval_status)}
                      {businessEvaluator && (
                        <span className="text-xs text-gray-500 hidden sm:inline">by {businessEvaluator.contact_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Overall:</span>
                      {getStatusBadge(getSolutionStatus(solution))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {solution.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{formatValue(solution.description)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <h3 className="text-lg font-semibold text-gradient-primary">Company Information</h3>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">Company Name:</span>
                        <p className="text-gray-700 truncate">{formatValue(solution.company_name)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">Country:</span>
                        <p className="text-gray-700 truncate">{formatValue(solution.country)}</p>
                      </div>
                    </div>

                    {solution.website && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-500">Website:</span>
                          <a href={solution.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 block transition-colors duration-200 truncate">
                            {formatValue(solution.website)}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">Revenue:</span>
                        <p className="text-gray-700 truncate">{formatValue(solution.revenue)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">Employees:</span>
                        <p className="text-gray-700 truncate"><span className="arabic-numerals">{formatValue(solution.employees)}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">Registration Document:</span>
                        {solution.registration_doc ? (
                          <a href={solution.registration_doc} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 block transition-colors duration-200 truncate">
                            View Document
                          </a>
                        ) : (
                          <p className="text-gray-700">N/A</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">LinkedIn:</span>
                        {solution.linkedin ? (
                          <a href={solution.linkedin} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 block transition-colors duration-200 truncate">
                            View Profile
                          </a>
                        ) : (
                          <p className="text-gray-700">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <h3 className="text-lg font-semibold text-gradient-primary">Contact Information</h3>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">Contact Name:</span>
                        <p className="text-gray-700 truncate">{formatValue(solution.contact_name)}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Wrench className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">Position:</span>
                        <p className="text-gray-700 truncate">{formatValue(solution.position)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">Contact Email:</span>
                        <a href={`mailto:${solution.contact_email}`} className="text-teal-600 hover:text-teal-800 block transition-colors duration-200 truncate">
                          {formatValue(solution.contact_email)}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <h3 className="text-lg font-semibold text-gradient-primary">Technical Details</h3>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Industry Focus</h4>
                      <div className="flex flex-wrap gap-2">
                        {industryFocusList.length > 0 ? (
                          industryFocusList.map((industry, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 shadow-sm"
                            >
                              {industry}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Technology Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {techCategoriesList.length > 0 ? (
                          techCategoriesList.map((tech, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 shadow-sm"
                            >
                              {tech}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Auto Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {autoTagsList.length > 0 ? (
                          autoTagsList.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 shadow-sm"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Deployment Model</h4>
                      <p className="text-gray-700">{formatValue(solution.deployment_model)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">Arabic Support:</span>
                        <p className="text-gray-700">{formatValue(solution.arabic_support)}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">TRL Level:</span>
                        <p className="text-gray-700">{formatValue(solution.trl)}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Wrench className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">Deployment Status:</span>
                        <p className="text-gray-700">{formatValue(solution.deployment_status)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-gray-500">KSA Customization:</span>
                        <p className="text-gray-700">{formatValue(solution.ksa_customization)}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-500">KSA Customization Details:</span>
                      <p className="text-gray-700 line-clamp-3">{formatValue(solution.ksa_customization_details)}</p>
                    </div>
                  </div>

                  {clientsList.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Clients</h4>
                      <div className="bg-gradient-to-r from-gray-50 to-teal-50 p-4 rounded-lg shadow-inner">
                        <div className="flex flex-wrap gap-2">
                          {clientsList.map((client, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 shadow-sm"
                            >
                              {client}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            {(solution.pitch_deck || solution.demo_video || (solution.product_images && Array.isArray(solution.product_images) && solution.product_images.length > 0)) && (
              <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <h3 className="text-lg font-semibold text-gradient-primary">Resources</h3>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {solution.pitch_deck && (
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-teal-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg mr-3 shadow-md flex-shrink-0">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-gray-700 font-medium truncate">Pitch Deck</span>
                        </div>
                        <a
                          href={solution.pitch_deck}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 flex items-center transition-colors duration-200 flex-shrink-0"
                        >
                          <Paperclip className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </div>
                    )}
                    
                    {solution.demo_video && (
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-teal-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg mr-3 shadow-md flex-shrink-0">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-gray-700 font-medium truncate">Demo Video</span>
                        </div>
                        <a
                          href={solution.demo_video}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 flex items-center transition-colors duration-200 flex-shrink-0"
                        >
                          <Paperclip className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </div>
                    )}

                    {solution.product_images && Array.isArray(solution.product_images) && solution.product_images.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-4">Product Images</h4>
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
            )}

            {/* Timestamps */}
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <h3 className="text-lg font-semibold text-gradient-primary">Timeline</h3>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-500">Created:</span>
                      <p className="text-gray-700 truncate">
                        {solution.created_at ? new Date(solution.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-500">Updated:</span>
                      <p className="text-gray-700 truncate">
                        {solution.updated_at ? new Date(solution.updated_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-500">Approved:</span>
                      <p className="text-gray-700 truncate">
                        {solution.approved_at ? new Date(solution.approved_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evaluation Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <h3 className="text-lg font-semibold text-gradient-primary">Technical Evaluation</h3>
                  {solution.tech_approval_status && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Current Status:</span>
                        {getStatusBadge(solution.tech_approval_status)}
                      </div>
                      {techEvaluator && (
                        <span className="text-sm text-gray-500 mt-1">by {techEvaluator.contact_name}</span>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <TextArea
                      label="Technical Feedback"
                      value={techFeedback}
                      onChange={(e) => setTechFeedback(e.target.value)}
                      placeholder="Provide technical feedback..."
                      required
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={techVoteStatus === 'approved' ? 'success' : 'outline'}
                        size="sm"
                        onClick={() => handleTechVote('approved')}
                        leftIcon={<CheckCircle className="h-4 w-4" />}
                        disabled={!techFeedback.trim()}
                        className="shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Approve
                      </Button>
                      <Button
                        variant={techVoteStatus === 'needs_clarification' ? 'warning' : 'outline'}
                        size="sm"
                        onClick={() => handleTechVote('needs_clarification')}
                        leftIcon={<AlertTriangle className="h-4 w-4" />}
                        disabled={!techFeedback.trim()}
                        className="shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Needs Clarification
                      </Button>
                      <Button
                        variant={techVoteStatus === 'rejected' ? 'danger' : 'outline'}
                        size="sm"
                        onClick={() => handleTechVote('rejected')}
                        leftIcon={<XCircle className="h-4 w-4" />}
                        disabled={!techFeedback.trim()}
                        className="shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
                  <h3 className="text-lg font-semibold text-gradient-secondary">Business Evaluation</h3>
                  {solution.business_approval_status && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Current Status:</span>
                        {getStatusBadge(solution.business_approval_status)}
                      </div>
                      {businessEvaluator && (
                        <span className="text-sm text-gray-500 mt-1">by {businessEvaluator.contact_name}</span>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <TextArea
                      label="Business Feedback"
                      value={businessFeedback}
                      onChange={(e) => setBusinessFeedback(e.target.value)}
                      placeholder="Provide business feedback..."
                      required
                    />
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={businessVoteStatus === 'approved' ? 'success' : 'outline'}
                        size="sm"
                        onClick={() => handleBusinessVote('approved')}
                        leftIcon={<CheckCircle className="h-4 w-4" />}
                        disabled={!businessFeedback.trim()}
                        className="shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Approve
                      </Button>
                      <Button
                        variant={businessVoteStatus === 'needs_clarification' ? 'warning' : 'outline'}
                        size="sm"
                        onClick={() => handleBusinessVote('needs_clarification')}
                        leftIcon={<AlertTriangle className="h-4 w-4" />}
                        disabled={!businessFeedback.trim()}
                        className="shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Needs Clarification
                      </Button>
                      <Button
                        variant={businessVoteStatus === 'rejected' ? 'danger' : 'outline'}
                        size="sm"
                        onClick={() => handleBusinessVote('rejected')}
                        leftIcon={<XCircle className="h-4 w-4" />}
                        disabled={!businessFeedback.trim()}
                        className="shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
            <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gradient-primary">Business Interest</h2>
                  <span className="px-2 sm:px-3 py-1 sm:py-1.5 text-sm font-medium bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 rounded-full shadow-sm">
                    {interests.length} interests
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
                        style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 space-y-2 sm:space-y-0">
                          <div 
                            className="text-teal-600 hover:text-teal-800 cursor-pointer font-medium transition-colors duration-200 min-w-0 flex-1"
                            onClick={() => navigate(`/companies/${interest.company_name}`)}
                          >
                            <div className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">{interest.company_name}</span>
                            </div>
                          </div>
                          <span className={`
                            px-2 sm:px-3 py-1 text-xs font-medium rounded-full shadow-sm flex-shrink-0
                            ${interest.status === 'Lead Initiated' 
                              ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800' 
                              : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800'}
                          `}>
                            {interest.status}
                          </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4 mr-1 text-teal-500 flex-shrink-0" />
                          <span className="truncate">{new Date(interest.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Mail className="h-4 w-4 mr-1 text-teal-500 flex-shrink-0" />
                          <a 
                            href={`mailto:${interest.contact_email}`}
                            className="text-teal-600 hover:text-teal-800 transition-colors duration-200 truncate"
                          >
                            {interest.contact_email}
                          </a>
                        </div>
                        
                        <div className="flex items-start mb-3">
                          <MessageSquare className="h-4 w-4 text-teal-500 mr-2 mt-1 flex-shrink-0" />
                          <p className="text-sm text-gray-600 line-clamp-3">{interest.message}</p>
                        </div>

                        {interest.status === 'Lead Initiated' && interest.comments && (
                          <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-teal-50 rounded-lg border border-teal-100">
                            <p className="text-sm text-gray-600 line-clamp-3">{interest.comments}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Initiated by {interest.users?.contact_name || 'Unknown'} on{' '}
                              {new Date(interest.initiated_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Mail className="h-4 w-4" />}
                            onClick={() => window.location.href = `mailto:${interest.contact_email}`}
                            className="shadow-sm hover:shadow-md transition-all duration-300 w-full sm:w-auto"
                          >
                            Contact
                          </Button>
                          {interest.status !== 'Lead Initiated' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleInitiateContact(interest.id)}
                              className="shadow-sm hover:shadow-md transition-all duration-300 w-full sm:w-auto"
                            >
                              Initiate Contact
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-teal-50 rounded-lg">
                      <p className="text-gray-500">No business interests yet</p>
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

        <AIRecommendationDialog
          isOpen={showAIRecommendationDialog}
          onClose={() => setShowAIRecommendationDialog(false)}
          solution={solution}
        />

        <OpenAIDialog
          isOpen={showOpenAIDialog}
          onClose={() => setShowOpenAIDialog(false)}
          solution={solution}
        />
      </div>
    </div>
  );
};

export default EvaluatorSolutionDetailPage;