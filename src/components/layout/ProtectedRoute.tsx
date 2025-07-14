import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import LoadingSpinner from '../common/LoadingSpinner';
import { ROUTES } from '../../utils/constants';

const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
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