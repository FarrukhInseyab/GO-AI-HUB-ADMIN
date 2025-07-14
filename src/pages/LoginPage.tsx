import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 safe-area-inset-top safe-area-inset-bottom">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <p className="text-center text-base sm:text-lg text-white font-medium">
          Admin Portal
        </p>
      </div>
      
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;