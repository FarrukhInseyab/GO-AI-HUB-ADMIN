import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Lock, AlertCircle, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LanguageToggle from '../ui/LanguageToggle';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/Card';

const SignupForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('Saudi Arabia');
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { signup, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('At least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('One number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('One special character');
    }
    
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword) {
      validatePassword(newPassword);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validatePassword(password)) {
      setError('Please fix the password requirements below');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      await signup(name, email, password, country);
      navigate('/');
    } catch (err: any) {
      setError(err.message || t('auth.accountCreationFailed'));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-0">
      <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-500 text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-white flex-1">
            {t('auth.signupTitle')}
          </h2>
          <LanguageToggle />
        </div>
        <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
          <p className="text-sm text-white/90">
            <strong>Admin Portal Access:</strong> This portal is exclusively for evaluators. 
            Only users with Evaluator role can access the system.
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
            label={t('auth.fullName')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('auth.enterFullName')}
            required
            fullWidth
            leftIcon={<User className="h-4 w-4" />}
          />
          
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
            label={t('common.country')}
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Enter your country"
            required
            fullWidth
            leftIcon={<MapPin className="h-4 w-4" />}
          />
          
          <Input
            label={t('common.password')}
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder={t('auth.createPassword')}
            required
            fullWidth
            leftIcon={<Lock className="h-4 w-4" />}
            error={passwordErrors.length > 0 ? 'Password requirements not met' : undefined}
          />

          {password && passwordErrors.length > 0 && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800 mb-2">Password must include:</p>
              <ul className="text-sm text-amber-700 space-y-1">
                {passwordErrors.map((error, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-amber-400 rounded-full mr-2 flex-shrink-0"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
            fullWidth
            leftIcon={<Lock className="h-4 w-4" />}
            error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
          />
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            className="mt-6"
            disabled={passwordErrors.length > 0 || password !== confirmPassword}
          >
            {t('auth.createAccount')}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center bg-gray-50 p-4 sm:p-6">
        <p className="text-sm text-gray-600">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link 
            to="/login" 
            className="text-primary-600 hover:text-primary-800 font-medium transition-colors duration-200"
          >
            {t('navigation.login')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default SignupForm;