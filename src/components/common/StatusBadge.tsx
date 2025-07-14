// Reusable status badge component
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, Activity, RotateCcw } from 'lucide-react';
import { APPROVAL_STATUS } from '../../utils/constants';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'sm', 
  showIcon = true 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case APPROVAL_STATUS.APPROVED:
        return {
          icon: CheckCircle,
          className: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200',
          label: 'Approved'
        };
      case APPROVAL_STATUS.REJECTED:
        return {
          icon: XCircle,
          className: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200',
          label: 'Rejected'
        };
      case APPROVAL_STATUS.NEEDS_CLARIFICATION:
        return {
          icon: AlertTriangle,
          className: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200',
          label: 'Needs Clarification'
        };
      case APPROVAL_STATUS.IN_REVIEW:
        return {
          icon: Activity,
          className: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200',
          label: 'In Review'
        };
      case APPROVAL_STATUS.RESUBMIT:
        return {
          icon: RotateCcw,
          className: 'bg-gradient-to-r from-blue-100 to-sky-100 text-blue-800 border border-blue-200',
          label: 'Resubmit'
        };
      case APPROVAL_STATUS.PENDING:
      default:
        return {
          icon: Clock,
          className: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200',
          label: 'Pending'
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'lg':
        return 'px-3 py-1.5 text-sm shadow-md';
      case 'md':
        return 'px-2.5 py-1 text-sm shadow-sm';
      case 'sm':
      default:
        return 'px-2 py-0.5 text-xs shadow-sm';
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses = getSizeClasses(size);

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClasses} transition-all duration-200 hover:shadow-md whitespace-nowrap`}>
      {showIcon && <Icon className="h-3 w-3 mr-1 flex-shrink-0" />}
      {config.label}
    </span>
  );
};

export default StatusBadge;