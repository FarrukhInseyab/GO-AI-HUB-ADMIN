// Enhanced error boundary with better error handling
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '../ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-teal-100 animate-fade-in-up">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-rose-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <AlertTriangle className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gradient-primary mb-2">
                  Something went wrong
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  We encountered an unexpected error. Please try one of the options below.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                    <p className="text-xs text-red-800 font-mono break-all">
                      {this.state.error.message}
                    </p>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="text-xs text-red-700 cursor-pointer">
                          Stack trace
                        </summary>
                        <pre className="text-xs text-red-600 mt-2 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="primary"
                    onClick={this.handleRetry}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    fullWidth
                  >
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={this.handleRefresh}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    fullWidth
                  >
                    Refresh Page
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={this.handleGoHome}
                    leftIcon={<Home className="h-4 w-4" />}
                    fullWidth
                  >
                    Go Home
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;