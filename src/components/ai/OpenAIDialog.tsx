import React, { useState } from 'react';
import { Zap, Loader2, XCircle } from 'lucide-react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import { Card, CardContent } from '../ui/Card';
import { Solution } from '../../types';
import { supabase } from '../../lib/supabase';

interface OpenAIDialogProps {
  isOpen: boolean;
  onClose: () => void;
  solution: Solution;
}

interface OpenAIResponse {
  rawResponse: string;
  processingTime: string;
  tokenUsage: number;
}

const OpenAIDialog: React.FC<OpenAIDialogProps> = ({
  isOpen,
  onClose,
  solution,
}) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<OpenAIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!userPrompt.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setRecommendation(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-analysis`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solution: {
            solution_name: solution.solution_name,
            company_name: solution.company_name,
            industry_focus: solution.industry_focus,
            tech_categories: solution.tech_categories,
            description: solution.description,
            summary: solution.summary,
            arabic_support: solution.arabic_support,
            ksa_customization: solution.ksa_customization,
            trl: solution.trl,
            deployment_status: solution.deployment_status,
            clients: solution.clients,
            revenue: solution.revenue,
            employees: solution.employees,
            country: solution.country
          },
          prompt: userPrompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate analysis');
      }

      const analysisResult = await response.json();
      
      // Clean the response text by removing ** formatting
      const cleanedResponse = analysisResult.rawResponse
        ? analysisResult.rawResponse.replace(/\*\*/g, '')
        : 'No response received';
      
      setRecommendation({
        rawResponse: cleanedResponse,
        processingTime: analysisResult.processingTime || '0s',
        tokenUsage: analysisResult.tokenUsage || 0
      });
    } catch (err: any) {
      console.error('GO.Ai | رُوَّاد Analysis Error:', err);
      setError(err.message || 'Failed to generate GO.Ai | رُوَّاد analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    setUserPrompt('');
    setRecommendation(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="GO.Ai | رُوَّاد Analysis"
    >
      <div className="space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 sm:p-6 rounded-xl border border-purple-200 shadow-lg">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg mr-3 shadow-md flex-shrink-0">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gradient-secondary text-base">GO.Ai | رُوَّاد Advanced Analysis</h3>
              <p className="text-sm text-purple-700">Advanced AI reasoning for Saudi market evaluation</p>
            </div>
          </div>
          <p className="text-sm text-purple-700 leading-relaxed">
            This analysis leverages GO.Ai | رُوَّاد's advanced language model to provide sophisticated reasoning about market dynamics, 
            competitive positioning, and strategic recommendations based on global best practices and Saudi-specific requirements.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <TextArea
              label="Analysis Focus"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Describe specific aspects you'd like GO.Ai | رُوَّاد to analyze (e.g., competitive positioning, market entry strategy, risk assessment, revenue projections, regulatory compliance, partnership opportunities)"
              rows={4}
              required
            />
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-red-600 font-medium text-sm">Analysis Error</p>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </CardContent>
          </Card>
        )}

        {recommendation && (
          <Card className="border-gray-200 shadow-lg animate-fade-in-up">
            <CardContent className="p-4 sm:p-6">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 bg-gradient-to-r from-gray-50 to-teal-50 p-3 rounded-lg">
                <span>Response time: {recommendation.processingTime}</span>
                <span className="mt-1 sm:mt-0">{recommendation.tokenUsage} tokens</span>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <div className="bg-gradient-to-r from-white to-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200 shadow-md">
                  <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
                    {recommendation.rawResponse}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="w-full sm:w-auto"
          >
            Close Analysis
          </Button>
          {!recommendation && (
            <Button
              variant="primary"
              onClick={handleAnalyze}
              disabled={!userPrompt.trim() || isAnalyzing}
              leftIcon={isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full sm:w-auto"
            >
              {isAnalyzing ? 'Analyzing with GO.Ai | رُوَّاد...' : 'Analyze with GO.Ai | رُوَّاد'}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default OpenAIDialog;