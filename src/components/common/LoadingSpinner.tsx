// Reusable loading spinner component
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  className = '' 
}) => {
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      case 'md':
      default:
        return 'h-6 w-6';
    }
  };

  const sizeClasses = getSizeClasses(size);

  if (text) {
    return (
      <div className={`flex items-center justify-center space-x-2 ${className}`}>
        <Loader2 className={`animate-spin text-primary-500 ${sizeClasses}`} />
        <span className="text-white font-medium">{text}</span>
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <Loader2 className={`animate-spin text-primary-500 ${sizeClasses}`} />
    </div>
  );
};

export default LoadingSpinner;