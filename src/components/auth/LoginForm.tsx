import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LanguageToggle from '../ui/LanguageToggle';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/Card';
import { User } from '@supabase/supabase-js';

type LoginResult = {
  user: User;
  email_confirmed: boolean;
};

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isConfirmed = searchParams.get('confirmed') === 'true';
  const emailFromUrl = searchParams.get('email');

  // Set email from URL if available
  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);
  
  // Show success message if redirected from email confirmation
  useEffect(() => {
    if (isConfirmed) {
      setSuccess('Your email has been confirmed successfully! Please log in to continue.');
    }
  }, [isConfirmed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
    const response : LoginResult= await login(email, password);
   if (response?.user && response?.email_confirmed) {
           navigate('/');
      } else {
        setError('Your email is not confirmed. Please check your inbox for the confirmation link.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error messages
      if (err.message.includes('Access denied')) {
        setError('Access denied. Only Evaluators can access this admin portal.');
      } else {
        setError(err.message || t('auth.invalidCredentials'));
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-0">
      <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-500 text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-white flex-1">
            {t('auth.loginTitle')}
          </h2>
          <LanguageToggle />
        </div>
        <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
          <p className="text-sm text-white/90">
            <strong>Evaluator Access Only:</strong> This admin portal is restricted to evaluators.
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg flex items-start">
            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
            {emailFromUrl && (
              <div className="mt-2 text-xs text-green-700">
                We've pre-filled your email address for convenience.
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.emailAddress')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.enterEmail')}
            required
            fullWidth
            leftIcon={<Mail className="h-4 w-4" />}
          />
          
          <Input
            label={t('common.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.enterPassword')}
            required
            fullWidth
            leftIcon={<Lock className="h-4 w-4" />}
          />
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            className="mt-6"
            disabled={!email.trim() || !password.trim()}
          >
            {t('navigation.login')}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center bg-gray-50 p-4 sm:p-6">
        <div className="flex flex-col items-center space-y-2">
          <p className="text-sm text-gray-600">
            {t('auth.dontHaveAccount')}{' '}
            <Link 
              to="/signup" 
              className="text-primary-600 hover:text-primary-800 font-medium transition-colors duration-200"
            >
              {t('navigation.signup')}
            </Link>
          </p>
          <Link 
            to="/forgot-password" 
            className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors duration-200"
          >
            Forgot your password?
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;