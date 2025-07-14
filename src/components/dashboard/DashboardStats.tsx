import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Clock, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { DashboardStats as DashboardStatsType } from '../../types';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, gradient, onClick }) => {
  return (
    <Card 
      className={`p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${onClick ? 'hover:bg-gradient-to-br hover:from-white hover:to-gray-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`p-3 sm:p-4 rounded-xl ${gradient} shadow-lg flex-shrink-0`}>
          {icon}
        </div>
        <div className="ml-4 sm:ml-5 rtl:ml-0 rtl:mr-4 sm:rtl:mr-5 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 arabic-numerals">{value}</p>
        </div>
      </div>
    </Card>
  );
};

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <StatsCard 
        title={t('dashboard.totalSubmissions')} 
        value={stats.total} 
        icon={<BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />}
        gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
        onClick={() => navigate('/submissions')}
      />
      <StatsCard 
        title={t('dashboard.pending')} 
        value={stats.pending} 
        icon={<Clock className="h-6 w-6 sm:h-7 sm:w-7 text-white" />}
        gradient="bg-gradient-to-br from-gray-500 to-slate-500"
        onClick={() => navigate('/submissions')}
      />
      <StatsCard 
        title={t('dashboard.inReview')} 
        value={stats.inReview} 
        icon={<Activity className="h-6 w-6 sm:h-7 sm:w-7 text-white" />}
        gradient="bg-gradient-to-br from-amber-500 to-orange-500"
        onClick={() => navigate('/submissions')}
      />
      <StatsCard 
        title={t('dashboard.approved')} 
        value={stats.approved} 
        icon={<CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />}
        gradient="bg-gradient-to-br from-emerald-500 to-green-500"
        onClick={() => navigate('/submissions')}
      />
      <StatsCard 
        title={t('dashboard.rejected')} 
        value={stats.rejected} 
        icon={<XCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />}
        gradient="bg-gradient-to-br from-red-500 to-rose-500"
        onClick={() => navigate('/submissions')}
      />
      <StatsCard 
        title={t('dashboard.needsClarification')} 
        value={stats.needsClarification} 
        icon={<AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />}
        gradient="bg-gradient-to-br from-purple-500 to-violet-500"
        onClick={() => navigate('/submissions')}
      />
    </div>
  );
};

export default DashboardStats;