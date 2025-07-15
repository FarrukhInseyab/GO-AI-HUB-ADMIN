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
  const navigate = useNavigate();

  // For debugging
  console.log('ProtectedRoute - User:', user?.email);
  console.log('ProtectedRoute - isConfirmed:', isConfirmed);
  console.log('ProtectedRoute - User email_confirmed:', user?.email_confirmed);
  
  // If user is confirmed in database but not in state, force a refresh
  useEffect(() => {
    if (user && user.email_confirmed && !isConfirmed) {
      console.log('User is confirmed in database but not in state, forcing refresh');
      refreshSession();
    }
  }, [user, isConfirmed]);

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
        <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full animate-fade-in-up">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center mb-2">Email Confirmation Required</h2>
          <p className="text-gray-600 text-center mb-6">
            Please check your email and click the confirmation link to activate your account.
            If you don't see the email, check your spam folder.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Return to Login
            </button>
            <button
              onClick={async () => {
                try {
                  await logout();
                  navigate('/login');
                } catch (error) {
                  navigate('/login');
                }
              }}
              className="w-full py-2 px-4 bg-white hover:bg-gray-100 text-primary-600 font-medium rounded-lg border border-primary-600 transition-colors"
            >
              Logout and Try Again
            </button>
          </div>
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