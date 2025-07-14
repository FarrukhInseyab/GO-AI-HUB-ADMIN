import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import './index.css';
import './i18n';

// Set initial document direction based on stored language
const storedLanguage = localStorage.getItem('i18nextLng') || 'en';
document.documentElement.dir = storedLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = storedLanguage;

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found</div>';
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    console.error('Error rendering application:', error);
    document.body.innerHTML = `<div style="padding: 20px; color: red;">Error starting application: ${error}</div>`;
  }
}