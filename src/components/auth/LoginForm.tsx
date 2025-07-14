import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LanguageToggle from '../ui/LanguageToggle';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/Card';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      await login(email, password);
      navigate('/');
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
        <p className="text-sm text-gray-600">
          {t('auth.dontHaveAccount')}{' '}
          <Link 
            to="/signup" 
            className="text-primary-600 hover:text-primary-800 font-medium transition-colors duration-200"
          >
            {t('navigation.signup')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;