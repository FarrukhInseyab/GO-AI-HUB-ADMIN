import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { Solution } from '../types';
import DashboardStats from '../components/dashboard/DashboardStats';
import StatusChart from '../components/dashboard/StatusChart';
import SubmissionCard from '../components/submissions/SubmissionCard';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type SortOption = 'newest' | 'oldest' | 'name' | 'company' | 'status';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [filteredSolutions, setFilteredSolutions] = useState<Solution[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inReview: 0,
    approved: 0,
    rejected: 0,
    needsClarification: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortSolutions();
  }, [solutions, searchTerm, statusFilter, sortBy, sortOrder]);

  const getStatus = (solution: Solution) => {
    const techStatus = solution.tech_approval_status || 'pending';
    const businessStatus = solution.business_approval_status || 'pending';

    if (techStatus === 'approved' && businessStatus === 'approved') return 'approved';
    if (techStatus === 'rejected' || businessStatus === 'rejected') return 'rejected';
    if (techStatus === 'needs_clarification' || businessStatus === 'needs_clarification') return 'needs_clarification';
    if (techStatus === 'in_review' || businessStatus === 'in_review') return 'in_review';
    return 'pending';
  };

  const fetchData = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('solutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const solutionsData = data || [];
      setSolutions(solutionsData);

      const newStats = {
        total: solutionsData.length,
        pending: 0,
        inReview: 0,
        approved: 0,
        rejected: 0,
        needsClarification: 0
      };

      solutionsData.forEach(solution => {
        const status = getStatus(solution);
        switch (status) {
          case 'pending':
            newStats.pending++;
            break;
          case 'in_review':
            newStats.inReview++;
            break;
          case 'approved':
            newStats.approved++;
            break;
          case 'rejected':
            newStats.rejected++;
            break;
          case 'needs_clarification':
            newStats.needsClarification++;
            break;
        }
      });

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortSolutions = () => {
    let filtered = solutions.filter(solution => {
      const matchesSearch = 
        solution.solution_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        solution.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(solution.industry_focus) 
          ? solution.industry_focus.some(industry => 
              industry.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : solution.industry_focus?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (Array.isArray(solution.tech_categories)
          ? solution.tech_categories.some(tech =>
              tech.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : solution.tech_categories?.toLowerCase().includes(searchTerm.toLowerCase()));

      if (statusFilter === 'all') return matchesSearch;
      
      const solutionStatus = getStatus(solution);
      return matchesSearch && solutionStatus === statusFilter;
    });

    // Sort solutions
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'newest':
          comparison = new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
          break;
        case 'oldest':
          comparison = new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
          break;
        case 'name':
          comparison = a.solution_name.localeCompare(b.solution_name);
          break;
        case 'company':
          comparison = a.company_name.localeCompare(b.company_name);
          break;
        case 'status':
          comparison = getStatus(a).localeCompare(getStatus(b));
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredSolutions(filtered);
  };

  const handleViewDetails = (solutionId: string) => {
    navigate(`/evaluator/solutions/${solutionId}`);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('newest');
    setSortOrder('desc');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || sortBy !== 'newest' || sortOrder !== 'desc';

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary mb-2">{t('dashboard.title')}</h1>
          <p className="text-white text-base sm:text-lg">{t('dashboard.subtitle')}</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <DashboardStats stats={stats} />
            </div>
            
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <StatusChart stats={stats} />
            </div>
            
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Card className="shadow-xl">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gradient-primary">
                      {t('solutions.title')} ({filteredSolutions.length})
                    </h2>
                    
                    <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 lg:space-x-4">
                      <div className="flex-1 min-w-0 sm:min-w-64">
                        <Input
                          placeholder={t('solutions.searchSolutions')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          leftIcon={<Search className="h-4 w-4" />}
                          fullWidth
                        />
                      </div>
                      
                      <div className="flex space-x-2 sm:space-x-3">
                        <select
                          className="flex-1 sm:flex-none border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white min-w-32 transition-all duration-200"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">{t('solutions.allStatuses')}</option>
                          <option value="pending">{t('status.pending')}</option>
                          <option value="in_review">{t('status.inReview')}</option>
                          <option value="approved">{t('status.approved')}</option>
                          <option value="rejected">{t('status.rejected')}</option>
                          <option value="needs_clarification">{t('status.needsClarification')}</option>
                        </select>
                        
                        <select
                          className="flex-1 sm:flex-none border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white min-w-32 transition-all duration-200"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="name">Solution Name</option>
                          <option value="company">Company Name</option>
                          <option value="status">Status</option>
                        </select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleSortOrder}
                          leftIcon={sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                          title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                          className="flex-shrink-0"
                        />
                        
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            leftIcon={<X className="h-4 w-4" />}
                            className="flex-shrink-0"
                          >
                            <span className="hidden sm:inline">Clear</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 sm:p-6">
                  {filteredSolutions.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-teal-50 rounded-xl">
                      <div className="flex flex-col items-center">
                        <Search className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {searchTerm || statusFilter !== 'all' ? 'No solutions found' : 'No solutions yet'}
                        </h3>
                        <p className="text-gray-500 mb-4 text-center max-w-md">
                          {searchTerm || statusFilter !== 'all' 
                            ? 'Try adjusting your search criteria or filters'
                            : 'Solutions will appear here once they are submitted'
                          }
                        </p>
                        {hasActiveFilters && (
                          <Button variant="outline" onClick={clearFilters}>
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                      {filteredSolutions.map((solution, index) => (
                        <div 
                          key={solution.id} 
                          onClick={() => handleViewDetails(solution.id)} 
                          className="cursor-pointer animate-fade-in-up"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <SubmissionCard solution={solution} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;