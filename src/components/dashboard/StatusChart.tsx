import React from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardStats } from '../../types';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface StatusChartProps {
  stats: DashboardStats;
}

const StatusChart: React.FC<StatusChartProps> = ({ stats }) => {
  const { t } = useTranslation();
  
  // Calculate percentages for the chart
  const total = stats.total;
  const getPercentage = (value: number) => Math.round((value / total) * 100) || 0;
  
  const pendingPercentage = getPercentage(stats.pending);
  const inReviewPercentage = getPercentage(stats.inReview);
  const approvedPercentage = getPercentage(stats.approved);
  const rejectedPercentage = getPercentage(stats.rejected);
  const needsClarificationPercentage = getPercentage(stats.needsClarification);

  return (
    <Card className="h-full">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-800 bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
          {t('dashboard.submissionStatusOverview')}
        </h3>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="w-full h-8 rounded-full bg-gray-200 overflow-hidden flex shadow-inner">
          {pendingPercentage > 0 && (
            <div 
              className="h-full bg-gradient-to-r from-gray-400 to-slate-500 transition-all duration-700 ease-in-out"
              style={{ width: `${pendingPercentage}%` }}
              title={`${t('status.pending')}: ${stats.pending} (${pendingPercentage}%)`}
            />
          )}
          {inReviewPercentage > 0 && (
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700 ease-in-out"
              style={{ width: `${inReviewPercentage}%` }}
              title={`${t('status.inReview')}: ${stats.inReview} (${inReviewPercentage}%)`}
            />
          )}
          {approvedPercentage > 0 && (
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-700 ease-in-out"
              style={{ width: `${approvedPercentage}%` }}
              title={`${t('status.approved')}: ${stats.approved} (${approvedPercentage}%)`}
            />
          )}
          {rejectedPercentage > 0 && (
            <div 
              className="h-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-700 ease-in-out"
              style={{ width: `${rejectedPercentage}%` }}
              title={`${t('status.rejected')}: ${stats.rejected} (${rejectedPercentage}%)`}
            />
          )}
          {needsClarificationPercentage > 0 && (
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-violet-500 transition-all duration-700 ease-in-out"
              style={{ width: `${needsClarificationPercentage}%` }}
              title={`${t('status.needsClarification')}: ${stats.needsClarification} (${needsClarificationPercentage}%)`}
            />
          )}
        </div>
        
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
          <div className="flex items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-400 to-slate-500 mr-2 rtl:mr-0 rtl:ml-2 shadow-sm flex-shrink-0"></div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-gray-700 truncate">{t('status.pending')}</span>
              <div className="text-xs text-gray-500 arabic-numerals">{pendingPercentage}%</div>
            </div>
          </div>
          <div className="flex items-center p-2 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors duration-200">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 mr-2 rtl:mr-0 rtl:ml-2 shadow-sm flex-shrink-0"></div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-amber-700 truncate">{t('status.inReview')}</span>
              <div className="text-xs text-amber-600 arabic-numerals">{inReviewPercentage}%</div>
            </div>
          </div>
          <div className="flex items-center p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors duration-200">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 mr-2 rtl:mr-0 rtl:ml-2 shadow-sm flex-shrink-0"></div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-emerald-700 truncate">{t('status.approved')}</span>
              <div className="text-xs text-emerald-600 arabic-numerals">{approvedPercentage}%</div>
            </div>
          </div>
          <div className="flex items-center p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors duration-200">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 to-rose-500 mr-2 rtl:mr-0 rtl:ml-2 shadow-sm flex-shrink-0"></div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-red-700 truncate">{t('status.rejected')}</span>
              <div className="text-xs text-red-600 arabic-numerals">{rejectedPercentage}%</div>
            </div>
          </div>
          <div className="flex items-center p-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors duration-200">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-violet-500 mr-2 rtl:mr-0 rtl:ml-2 shadow-sm flex-shrink-0"></div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-purple-700 truncate">{t('status.needsClarification')}</span>
              <div className="text-xs text-purple-600 arabic-numerals">{needsClarificationPercentage}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusChart;