import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Solution } from '../types';
import SubmissionList from '../components/submissions/SubmissionList';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const SubmissionsPage: React.FC = () => {
  const { refreshSession } = useAuth();
  const { t } = useTranslation();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSolutions();
  }, []);

  const fetchSolutions = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      let { data, error } = await supabase
        .from('solutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error?.message.includes('JWT expired')) {
        await refreshSession();
        ({ data, error } = await supabase
          .from('solutions')
          .select('*')
          .order('created_at', { ascending: false }));
      }

      if (error) throw error;
      setSolutions(data || []);
    } catch (error) {
      console.error('Error fetching solutions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary mb-2">{t('solutions.title')}</h1>
          <p className="text-white text-base sm:text-lg">{t('solutions.subtitle')}</p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <SubmissionList solutions={solutions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionsPage;