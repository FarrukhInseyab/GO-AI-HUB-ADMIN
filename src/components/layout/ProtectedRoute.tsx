import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import LoadingSpinner from '../common/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { ROUTES } from '../../utils/constants';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading, isConfirmed } = useAuth();
  const location = useLocation();

  // If auth is still loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading..." />
          <p className="mt-4 text-white font-medium">Preparing your Admin Portal experience...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If email is not confirmed, show confirmation required message
  if (user && !isConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex justify-center items-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center mb-2">Email Confirmation Required</h2>
          <p className="text-gray-600 text-center mb-6">
            Please check your email and click the confirmation link to activate your account.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute;