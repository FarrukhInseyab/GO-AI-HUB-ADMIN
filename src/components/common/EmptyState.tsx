// Reusable empty state component
import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import Button from '../ui/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`text-center py-8 sm:py-12 ${className} bg-gradient-to-br from-gray-50 to-teal-50 rounded-xl shadow-md animate-fade-in-up px-4 sm:px-6`}>
      <div className="p-3 sm:p-4 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full mx-auto mb-4 sm:mb-6 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-lg">
        <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gradient-primary mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm sm:text-base">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="w-full sm:w-auto">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;