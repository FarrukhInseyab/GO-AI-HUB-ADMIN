import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    helperText, 
    error, 
    fullWidth = false, 
    leftIcon, 
    rightIcon, 
    className = '', 
    id, 
    ...props 
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-primary-500 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`
              block w-full rounded-lg border
              ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'}
              shadow-sm px-4 py-2.5 bg-white text-gray-900
              placeholder:text-gray-400 focus:outline-none transition-all duration-200
              disabled:bg-gray-100 disabled:text-gray-500
              ${leftIcon ? 'pl-10 rtl:pl-4 rtl:pr-10' : ''}
              ${rightIcon ? 'pr-10 rtl:pr-4 rtl:pl-10' : ''}
              ${className}
              mobile-text
            `}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-primary-500 rtl:right-auto rtl:left-0 rtl:pr-0 rtl:pl-3">
              {rightIcon}
            </div>
          )}
        </div>
        
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;