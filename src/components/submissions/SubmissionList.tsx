import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Solution } from '../../types';
import SubmissionCard from './SubmissionCard';
import Input from '../ui/Input';

interface SubmissionListProps {
  solutions: Solution[];
}

const SubmissionList: React.FC<SubmissionListProps> = ({ solutions }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const filteredSolutions = solutions.filter(solution => {
    const matchesSearch = 
      solution.solution_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solution.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(solution.industry_focus) 
        ? solution.industry_focus.some(industry => 
            industry.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : solution.industry_focus?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    
    if (statusFilter === 'approved') {
      return matchesSearch && 
        solution.tech_approval_status === 'approved' && 
        solution.business_approval_status === 'approved';
    }
    
    if (statusFilter === 'rejected') {
      return matchesSearch && 
        (solution.tech_approval_status === 'rejected' || 
         solution.business_approval_status === 'rejected');
    }
    
    if (statusFilter === 'needs_clarification') {
      return matchesSearch && 
        (solution.tech_approval_status === 'needs_clarification' || 
         solution.business_approval_status === 'needs_clarification');
    }
    
    return matchesSearch && 
      (solution.tech_approval_status === statusFilter || 
       solution.business_approval_status === statusFilter);
  });

  const hasActiveFilters = searchTerm || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder={t('solutions.searchSolutions')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              fullWidth
            />
          </div>
          <div className="flex space-x-3">
            <select
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm transition-all duration-200 min-w-32"
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
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <X className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {filteredSolutions.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-teal-50 rounded-xl shadow-md">
          <p className="text-gray-500 mb-4">{hasActiveFilters ? t('solutions.noSolutionsFound') : 'No solutions available'}</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-teal-600 hover:text-teal-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {filteredSolutions.map((solution, index) => (
            <div 
              key={solution.id} 
              className="animate-fade-in-up" 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <SubmissionCard key={solution.id} solution={solution} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubmissionList;