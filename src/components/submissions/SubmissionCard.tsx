import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, MessageSquare, Mail, Building2, MapPin, Globe, Clock } from 'lucide-react';
import { Solution } from '../../types';
import Button from '../ui/Button';
import { Card, CardContent, CardFooter } from '../ui/Card';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { useInterests } from '../../hooks/useInterests';
import { formatDate, formatResponseTime, getResponseTimeColor, getSolutionStatus, normalizeArray, formatValue } from '../../utils/helpers';

interface SubmissionCardProps {
  solution: Solution;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ solution }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { fetchInterestsBySolution, isLoading: interestsLoading } = useInterests();
  const [interestCount, setInterestCount] = useState<number>(0);
  const [avgResponseTime, setAvgResponseTime] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadInterestData();
    if (solution.user_id) {
      loadUserData();
    }
  }, [solution.id, solution.user_id]);

  const loadInterestData = async () => {
    const result = await fetchInterestsBySolution(solution.id);
    if (result.data) {
      const interests = result.data;
      setInterestCount(interests.length);

      // Calculate average response time
      const respondedInterests = interests.filter(interest => 
        interest.initiated_at && interest.created_at
      );

      if (respondedInterests.length > 0) {
        const totalResponseTime = respondedInterests.reduce((sum, interest) => {
          const createdAt = new Date(interest.created_at);
          const initiatedAt = new Date(interest.initiated_at);
          const responseTimeHours = (initiatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          return sum + responseTimeHours;
        }, 0);

        setAvgResponseTime(totalResponseTime / respondedInterests.length);
      }
    }
  };

  const loadUserData = async () => {
    // This would be implemented with a user hook similar to useInterests
    // For now, we'll use the solution data
    setUser({
      company_name: solution.company_name,
      country: solution.country
    });
  };

  const handleViewDetails = () => {
    const currentPath = location.pathname;
    
    if (currentPath.includes('/customers/')) {
      navigate(`/customer/solutions/${solution.id}`, { state: { from: currentPath } });
    } else if (currentPath === '/') {
      navigate(`/evaluator/solutions/${solution.id}`, { state: { from: currentPath } });
    } else {
      navigate(`/submissions/${solution.id}`, { state: { from: currentPath } });
    }
  };

  const solutionStatus = getSolutionStatus(solution);
  const industryFocusList = normalizeArray(solution.industry_focus);
  const techCategoriesList = normalizeArray(solution.tech_categories);

  return (
    <Card className="transition-all duration-300 hover:shadow-2xl hover:scale-105 card-hover bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 text-gradient-primary pr-2 sm:pr-0">
            {solution.solution_name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <div className="flex items-center text-teal-600 bg-gradient-to-r from-teal-50 to-cyan-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium shadow-sm">
              <MessageSquare className="h-3 w-3 mr-1 rtl:mr-0 rtl:ml-1" />
              {interestsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                `${interestCount} ${t('solutions.interests')}`
              )}
            </div>
            {avgResponseTime !== null && (
              <div className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium shadow-sm ${getResponseTimeColor(avgResponseTime)}`}>
                <Clock className="h-3 w-3 mr-1 rtl:mr-0 rtl:ml-1" />
                {formatResponseTime(avgResponseTime)}
              </div>
            )}
            <StatusBadge status={solutionStatus} />
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 sm:line-clamp-3">
          {solution.summary}
        </p>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center">
            <Building2 className="h-4 w-4 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-500 mr-2 rtl:mr-0 rtl:ml-2">
              {t('common.company')}:
            </span>
            <span className="text-sm text-gray-800 font-medium truncate">
              {user?.company_name || solution.company_name}
            </span>
          </div>

          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-500 mr-2 rtl:mr-0 rtl:ml-2">
              {t('common.country')}:
            </span>
            <span className="text-sm text-gray-800 font-medium truncate">
              {user?.country || solution.country || 'N/A'}
            </span>
          </div>
          
          <div className="flex items-start">
            <span className="text-sm font-medium text-gray-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0">
              {t('solutions.industryFocus')}:
            </span>
            <span className="text-sm text-gray-800 line-clamp-1">
              {industryFocusList.join(', ') || 'N/A'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Calendar className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1 text-teal-500 flex-shrink-0" />
          <span className="truncate">
            {t('solutions.submittedOn')} {formatDate(solution.created_at)}
          </span>
        </div>
        
        {techCategoriesList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {techCategoriesList.slice(0, 2).map((tech, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 shadow-sm"
              >
                {tech}
              </span>
            ))}
            {techCategoriesList.length > 2 && (
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{techCategoriesList.length - 2} more
              </span>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-teal-50 border-t border-gray-100">
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={handleViewDetails}
          className="btn-hover"
        >
          {t('solutions.viewDetails')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubmissionCard;