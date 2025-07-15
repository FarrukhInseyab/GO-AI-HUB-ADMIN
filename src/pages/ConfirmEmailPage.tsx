import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, ArrowLeft, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 
import Button from '../components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';

const ConfirmEmailPage: React.FC = () => {
  const { confirmEmail, isLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        console.log('No token found in URL parameters');
        setError('Invalid or missing confirmation token');
        setIsProcessing(false);
        return;
      }

      // Log the full token for debugging
      console.log('Verifying token from URL:', token);
      
      // Make sure to trim any whitespace from the token
      const cleanToken = token.trim();
      console.log('Cleaned token:', cleanToken);
      
      try {
        await confirmEmail(cleanToken);
        setSuccess(true);
        console.log('Email confirmed successfully, redirecting to login page');
        
        // Get email from token if possible
        try {
          const decodedToken = atob(cleanToken);
          const [extractedEmail] = decodedToken.split(':');
          if (extractedEmail && extractedEmail.includes('@')) {
            setEmail(extractedEmail);
          }
        } catch (e) {
          console.error('Could not extract email from token:', e);
        }
        
        // Wait a moment to show success message before redirecting
        setTimeout(() => {
          // Redirect to login page with confirmed=true parameter
          navigate(`/login?confirmed=true${email ? `&email=${encodeURIComponent(email)}` : ''}`);
        }, 2000);
      } catch (err: any) {
        console.error('Confirmation error:', err);
        setError(err.message || 'Failed to confirm email');
      } finally {
        setIsProcessing(false);
      }
    };

    verifyToken();
  }, [token, confirmEmail, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 safe-area-inset-top safe-area-inset-bottom">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <p className="text-center text-base sm:text-lg text-white font-medium">
          Admin Portal
        </p>
      </div>
      
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-500 text-white">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-white flex-1">
              Email Confirmation
            </h2>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6">
            {isProcessing ? (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
                <p className="text-gray-600">Verifying your email confirmation...</p>
              </div>
            ) : error ? (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                <div className="flex items-center mb-3">
                  <AlertCircle className="h-6 w-6 mr-2 text-red-500 flex-shrink-0" />
                  <h3 className="font-medium">Confirmation Failed</h3>
                </div>
                <p className="text-sm">{error}</p>
              </div>
            ) : success ? (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-6 w-6 mr-2 text-green-500 flex-shrink-0" />
                  <h3 className="font-medium">Email Confirmed</h3>
                </div>
                <p className="text-sm">Your email has been successfully confirmed. You will be redirected to the login page in a moment.</p>
                <div className="mt-4 text-center">
                  <Button
                    variant="primary"
                     onClick={() => navigate(`/login?confirmed=true${email ? `&email=${encodeURIComponent(email)}` : ''}`)}
                     leftIcon={<LogIn className="h-4 w-4" />}
                  >
                    Go to Login Now
                  </Button>
                </div>
              </div>
            ) : null}
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
      </div>
    </div>
  );
};

export default ConfirmEmailPage;