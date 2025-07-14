// Application constants
export const APP_CONFIG = {
  NAME: 'GO AI HUB Admin Portal',
  VERSION: '1.0.0',
  DESCRIPTION: 'Admin portal for GO AI HUB evaluators'
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/',
  SUBMISSIONS: '/submissions',
  BUSINESS_INTEREST: '/business-interest',
  CUSTOMERS: '/customers',
  PROFILE: '/profile'
} as const;

export const SOLUTION_STATUS = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_CLARIFICATION: 'needs_clarification',
  RESUBMIT: 'resubmit'
} as const;

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_CLARIFICATION: 'needs_clarification',
  RESUBMIT: 'resubmit'
} as const;

export const INTEREST_STATUS = {
  NEW: 'New Interest',
  INITIATED: 'Lead Initiated'
} as const;

export const USER_ROLES = {
  USER: 'User',
  EVALUATOR: 'Evaluator'
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const;

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
} as const;