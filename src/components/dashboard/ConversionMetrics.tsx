import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Clock, Target, DollarSign, Users, UserPlus } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface ConversionMetricsProps {
  stats: {
    totalInterests: number;
    activeLeads: number;
    convertedLeads: number;
    notConvertedLeads: number;
    pendingConversion: number;
    conversionRate: number;
    avgResponseTime: number | null;
    avgConversionTime: number | null;
  };
}

const ConversionMetrics: React.FC<ConversionMetricsProps> = ({ stats }) => {
  const { t } = useTranslation();
  
  const formatTime = (hours: number | null): string => {
    if (!hours) return 'N/A';
    
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.round(hours / 24);
      return `${days}d`;
    }
  };

  const getConversionRateColor = (rate: number): string => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-4 sm:p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">New Interests</p>
                <p className="text-2xl sm:text-3xl font-bold text-gradient-primary arabic-numerals">{stats.totalInterests}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg flex-shrink-0">
                <UserPlus className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-4 sm:p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Active Leads</p>
                <p className="text-2xl sm:text-3xl font-bold text-gradient-primary arabic-numerals">{stats.activeLeads}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg flex-shrink-0">
                <Target className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-4 sm:p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Conversion Rate</p>
                <p className={`text-2xl sm:text-3xl font-bold arabic-numerals ${getConversionRateColor(stats.conversionRate)}`}>
                  {stats.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl shadow-lg flex-shrink-0">
                <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-4 sm:p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Converted to Sales</p>
                <p className="text-2xl sm:text-3xl font-bold text-gradient-primary arabic-numerals">{stats.convertedLeads}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg flex-shrink-0">
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-4 sm:p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Not Converted</p>
                <p className="text-2xl sm:text-3xl font-bold text-gradient-primary arabic-numerals">{stats.notConvertedLeads}</p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl shadow-lg flex-shrink-0">
                <TrendingDown className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-4 sm:p-6 h-full">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Avg Conversion Time</p>
                <p className="text-2xl sm:text-3xl font-bold text-gradient-primary truncate">
                  {formatTime(stats.avgConversionTime)}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg flex-shrink-0">
                <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConversionMetrics;