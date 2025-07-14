import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import { Card, CardContent } from '../ui/Card';
import { Solution } from '../../types';

interface AIRecommendationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  solution: Solution;
}

const AIRecommendationDialog: React.FC<AIRecommendationDialogProps> = ({
  isOpen,
  onClose,
  solution,
}) => {
  const { t } = useTranslation();
  const [userPrompt, setUserPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizeClients = (clients: unknown): string[] => {
    if (Array.isArray(clients)) {
      return clients;
    }
    if (typeof clients === 'string') {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(clients);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return [clients]; // If parsed but not array, treat as single string
      } catch {
        // If JSON parsing fails, treat as single string
        return [clients];
      }
    }
    return [];
  };

  const handleAnalyze = async () => {
    if (!userPrompt.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setRecommendation(null);

    try {
      // Simulate AI analysis with realistic delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock AI recommendation based on solution data
      const mockRecommendation = generateMockRecommendation(solution, userPrompt);
      setRecommendation(mockRecommendation);
    } catch (err) {
      setError(t('analysis.analysisError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMockRecommendation = (solution: Solution, prompt: string) => {
    // Analyze solution characteristics
    const hasArabicSupport = solution.arabic_support;
    const hasKSACustomization = solution.ksa_customization;
    const industryFocus = Array.isArray(solution.industry_focus) ? solution.industry_focus : [solution.industry_focus];
    const techCategories = Array.isArray(solution.tech_categories) ? solution.tech_categories : [solution.tech_categories];
    
    // Strategic industries for Saudi Vision 2030
    const strategicIndustries = ['Energy', 'Healthcare', 'Education', 'Tourism', 'Agriculture', 'Manufacturing', 'Technology'];
    const isStrategicIndustry = industryFocus.some(industry => 
      strategicIndustries.some(strategic => industry?.toLowerCase().includes(strategic.toLowerCase()))
    );

    // Calculate recommendation score
    let score = 60; // Base score
    
    if (hasArabicSupport) score += 15;
    if (hasKSACustomization) score += 20;
    if (isStrategicIndustry) score += 25;
    if (solution.trl && parseInt(solution.trl) >= 7) score += 10;
    if (solution.clients && normalizeClients(solution.clients).length > 0) score += 10;
    
    // Determine recommendation
    const shouldRecommend = score >= 75;
    const confidence = Math.min(95, Math.max(60, score + Math.random() * 10));

    return {
      recommendation: shouldRecommend ? 'RECOMMEND' : 'NOT_RECOMMEND',
      confidence: Math.round(confidence),
      score: Math.round(score),
      analysis: {
        saudiMarketFit: {
          score: hasArabicSupport && hasKSACustomization ? 85 : 65,
          factors: [
            { factor: 'Arabic Language Support', status: hasArabicSupport ? 'positive' : 'negative', impact: 'High' },
            { factor: 'KSA Customization', status: hasKSACustomization ? 'positive' : 'negative', impact: 'High' },
            { factor: 'Vision 2030 Alignment', status: isStrategicIndustry ? 'positive' : 'neutral', impact: 'Medium' },
            { factor: 'Local Market Understanding', status: 'neutral', impact: 'Medium' }
          ]
        },
        globalContext: {
          score: 75,
          factors: [
            { factor: 'Technology Maturity', status: solution.trl && parseInt(solution.trl) >= 7 ? 'positive' : 'neutral', impact: 'High' },
            { factor: 'Market Validation', status: solution.clients ? 'positive' : 'neutral', impact: 'High' },
            { factor: 'Scalability Potential', status: 'positive', impact: 'Medium' },
            { factor: 'Competitive Landscape', status: 'neutral', impact: 'Medium' }
          ]
        },
        technicalAssessment: {
          score: 80,
          factors: [
            { factor: 'Technical Readiness Level', status: solution.trl && parseInt(solution.trl) >= 7 ? 'positive' : 'neutral', impact: 'High' },
            { factor: 'Deployment Model', status: solution.deployment_model ? 'positive' : 'neutral', impact: 'Medium' },
            { factor: 'Integration Complexity', status: 'neutral', impact: 'Medium' },
            { factor: 'Security & Compliance', status: 'positive', impact: 'High' }
          ]
        },
        businessViability: {
          score: 70,
          factors: [
            { factor: 'Revenue Model', status: solution.revenue ? 'positive' : 'neutral', impact: 'High' },
            { factor: 'Market Size', status: 'positive', impact: 'High' },
            { factor: 'Customer Acquisition', status: solution.clients ? 'positive' : 'neutral', impact: 'Medium' },
            { factor: 'Financial Sustainability', status: 'neutral', impact: 'Medium' }
          ]
        }
      },
      keyInsights: [
        shouldRecommend 
          ? "Strong alignment with Saudi Vision 2030 objectives and market requirements"
          : "Requires significant adaptation for Saudi market entry",
        isStrategicIndustry 
          ? "Operates in a strategic industry prioritized by Saudi Arabia"
          : "Industry focus may need realignment with national priorities",
        hasArabicSupport && hasKSACustomization
          ? "Excellent localization for Saudi market"
          : "Localization improvements needed for market success"
      ],
      recommendations: shouldRecommend ? [
        "Proceed with marketplace integration",
        "Establish local partnerships for market entry",
        "Develop comprehensive go-to-market strategy",
        "Ensure compliance with Saudi regulations"
      ] : [
        "Enhance Arabic language support",
        "Develop KSA-specific customizations",
        "Conduct deeper market research",
        "Consider strategic partnerships before market entry"
      ],
      nextSteps: [
        "Conduct detailed technical due diligence",
        "Validate business model with local stakeholders",
        "Assess regulatory compliance requirements",
        "Develop pilot program proposal"
      ]
    };
  };

  const getRecommendationIcon = () => {
    if (!recommendation) return null;
    
    switch (recommendation.recommendation) {
      case 'RECOMMEND':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'NOT_RECOMMEND':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-amber-600" />;
    }
  };

  const getRecommendationColor = () => {
    if (!recommendation) return '';
    
    switch (recommendation.recommendation) {
      case 'RECOMMEND':
        return 'text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      case 'NOT_RECOMMEND':
        return 'text-red-600 bg-gradient-to-r from-red-50 to-rose-50 border-red-200';
      default:
        return 'text-amber-600 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
    }
  };

  const getFactorIcon = (status: string) => {
    switch (status) {
      case 'positive':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
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
      title="GO.Ai | رُوَّاد Local Analysis"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 sm:p-5 rounded-xl border border-teal-100 shadow-md">
          <div className="flex items-center mb-3">
            <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg mr-3 shadow-md flex-shrink-0">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gradient-primary">GO.Ai | رُوَّاد Local Analysis Context</h3>
              <p className="text-xs text-gray-600">Advanced AI reasoning for Saudi market evaluation</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            GO.Ai | رُوَّاد will analyze this solution against Saudi market requirements, Vision 2030 objectives, global market trends, and your specific criteria.
          </p>
        </div>

        <TextArea
          label={t('analysis.analysisPrompt')}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Describe specific aspects you'd like GO.Ai | رُوَّاد to focus on (e.g., market readiness, competitive advantages, regulatory considerations, etc.)"
          rows={4}
          required
        />

        {error && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-600 rounded-lg flex items-start">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {recommendation && (
          <div className="space-y-6 animate-fade-in-up">
            <Card className={`border-2 shadow-xl ${getRecommendationColor()}`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                  <div className="flex items-center">
                    {getRecommendationIcon()}
                    <h3 className="text-lg font-bold ml-2 rtl:ml-0 rtl:mr-2">
                      {recommendation.recommendation === 'RECOMMEND' ? t('analysis.recommendedForMarketplace') : t('analysis.notRecommended')}
                    </h3>
                  </div>
                  <div className="text-center sm:text-right rtl:text-left">
                    <div className="text-sm text-gray-500">GO.Ai | رُوَّاد Confidence</div>
                    <div className="text-xl sm:text-2xl font-bold text-gradient-primary arabic-numerals">{recommendation.confidence}%</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  <div className="text-center p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg shadow-md">
                    <div className="text-xl sm:text-2xl font-bold text-gradient-primary arabic-numerals">{recommendation.analysis.saudiMarketFit.score}</div>
                    <div className="text-xs text-gray-600">{t('analysis.saudiMarketFit')}</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg shadow-md">
                    <div className="text-xl sm:text-2xl font-bold text-gradient-secondary arabic-numerals">{recommendation.analysis.globalContext.score}</div>
                    <div className="text-xs text-gray-600">{t('analysis.globalContext')}</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg shadow-md">
                    <div className="text-xl sm:text-2xl font-bold text-gradient-secondary arabic-numerals">{recommendation.analysis.technicalAssessment.score}</div>
                    <div className="text-xs text-gray-600">{t('analysis.technical')}</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-md">
                    <div className="text-xl sm:text-2xl font-bold text-gradient-secondary arabic-numerals">{recommendation.analysis.businessViability.score}</div>
                    <div className="text-xs text-gray-600">{t('analysis.business')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(recommendation.analysis).map(([category, data]: [string, any]) => (
                <Card key={category} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3 capitalize text-gradient-primary">{category.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <div className="space-y-2">
                      {data.factors.map((factor: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                          <div className="flex items-center min-w-0">
                            {getFactorIcon(factor.status)}
                            <span className="ml-2 rtl:ml-0 rtl:mr-2 truncate">{factor.factor}</span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 flex-shrink-0">{factor.impact}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-gradient-primary">{t('analysis.keyInsights')}</h4>
                <ul className="space-y-2">
                  {recommendation.keyInsights.map((insight: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start p-2 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg shadow-sm">
                      <span className="text-teal-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0">•</span>
                      <span className="line-clamp-2">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-3 text-gradient-primary">{t('analysis.recommendations')}</h4>
                <ul className="space-y-2">
                  {recommendation.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start p-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg shadow-sm">
                      <span className="text-emerald-500 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0">•</span>
                      <span className="line-clamp-2">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3 text-gradient-primary">{t('analysis.nextSteps')}</h4>
              <ul className="space-y-2">
                {recommendation.nextSteps.map((step: string, index: number) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start p-2 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg shadow-sm">
                    <span className="text-purple-500 mr-2 rtl:mr-0 rtl:ml-2 arabic-numerals flex-shrink-0">{index + 1}.</span>
                    <span className="line-clamp-2">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 rtl:space-x-reverse pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            {t('common.close')}
          </Button>
          {!recommendation && (
            <Button
              variant="primary"
              onClick={handleAnalyze}
              disabled={!userPrompt.trim() || isAnalyzing}
              leftIcon={isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              className="w-full sm:w-auto"
            >
              {isAnalyzing ? 'Analyzing with GO.Ai | رُوَّاد...' : 'Generate GO.Ai | رُوَّاد Analysis'}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default AIRecommendationDialog;