import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LanguageToggle from '../ui/LanguageToggle';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/Card';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { forgotPassword, isLoading } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSuccess(false);
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      console.log('Submitting forgot password form for:', email);
      await forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Forgot password form error:', err);
      setError(err.message || 'Failed to send password reset email. Please try again later.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-0">
      <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-500 text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-white flex-1">
            {t('auth.forgotPasswordTitle')}
          </h2>
          <LanguageToggle />
        </div>
        <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
          <p className="text-sm text-white/90">
            Enter your email address and we'll send you a link to reset your password.
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
        
        {success ? (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg flex items-start">
            <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Password reset email sent!</p>
              <p className="text-sm mt-1">Please check your email for instructions to reset your password. If you don't see it, check your spam folder.</p>
            </div>
          </div>
        ) : (
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
            
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              className="mt-6"
              disabled={!email.trim()}
            >
              Send Reset Link
            </Button>
          </form>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-center bg-gray-50 p-4 sm:p-6">
        <Link 
          to="/login" 
          className="text-primary-600 hover:text-primary-800 font-medium transition-colors duration-200 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ForgotPasswordForm;