// Utility helper functions
import { SOLUTION_STATUS, APPROVAL_STATUS } from './constants';

export const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
};

export const formatTimeAgo = (date: string | Date): string => {
  if (!date) return 'N/A';
  
  const now = new Date();
  const past = new Date(date);
  const diffInHours = (now.getTime() - past.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const minutes = Math.round(diffInHours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    const hours = Math.round(diffInHours);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.round(diffInHours / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

export const formatResponseTime = (hours: number): string => {
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

export const getResponseTimeColor = (hours: number): string => {
  if (hours <= 2) return 'text-green-600 bg-green-50';
  if (hours <= 24) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
};

export const getSolutionStatus = (solution: any): string => {
  const techStatus = solution.tech_approval_status || APPROVAL_STATUS.PENDING;
  const businessStatus = solution.business_approval_status || APPROVAL_STATUS.PENDING;

  // If both are approved, solution is approved
  if (techStatus === APPROVAL_STATUS.APPROVED && businessStatus === APPROVAL_STATUS.APPROVED) {
    return SOLUTION_STATUS.APPROVED;
  }
  
  // If either is rejected, solution is rejected
  if (techStatus === APPROVAL_STATUS.REJECTED || businessStatus === APPROVAL_STATUS.REJECTED) {
    return SOLUTION_STATUS.REJECTED;
  }
  
  // All other cases are pending (including needs clarification, in review, etc.)
  return SOLUTION_STATUS.PENDING;
};

export const normalizeArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
};

export const formatValue = (value: any): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'N/A';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return 'N/A';
    }
  }
  return String(value);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};