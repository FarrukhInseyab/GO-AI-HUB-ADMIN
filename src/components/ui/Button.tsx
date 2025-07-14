import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'warning';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantClasses = (): string => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200';
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 hover:border-gray-300';
      case 'outline':
        return 'border border-primary-300 hover:bg-primary-50 text-primary-700 hover:text-primary-800 hover:border-primary-400 transition-all duration-200';
      case 'ghost':
        return 'hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-all duration-200';
      case 'success':
        return 'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200';
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200';
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200';
      default:
        return 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200';
    }
  };

  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'text-xs px-3 py-1.5 rounded-lg';
      case 'md':
        return 'text-sm px-4 py-2 rounded-lg';
      case 'lg':
        return 'text-base px-6 py-3 rounded-lg';
      default:
        return 'text-sm px-4 py-2 rounded-lg';
    }
  };

  return (
    <button
      className={`
        font-medium transition-all duration-200 ease-in-out 
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 focus:ring-offset-2
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${isLoading || disabled ? 'opacity-60 cursor-not-allowed transform-none' : ''} 
        active:text-white
        ${className}
        flex items-center justify-center gap-2 min-h-[38px] sm:min-h-0
      `}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;