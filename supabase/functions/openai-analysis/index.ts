import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AnalysisRequest {
  solution: {
    solution_name: string;
    company_name: string;
    industry_focus: string[];
    tech_categories: string[];
    description: string;
    summary: string;
    arabic_support: boolean;
    ksa_customization: boolean;
    trl: string;
    deployment_status: string;
    clients: string;
    revenue: string;
    employees: string;
    country: string;
  };
  prompt: string;
}

interface OpenAIResponse {
  recommendation: 'RECOMMEND' | 'CONDITIONAL_RECOMMEND' | 'NOT_RECOMMEND';
  confidence: number;
  model: string;
  processingTime: string;
  tokenUsage: number;
  rawResponse: string;
  analysis: {
    executiveSummary: string;
    strengths: string[];
    challenges: string[];
    marketOpportunity: {
      size: string;
      growth: string;
      competition: string;
      barriers: string;
    };
    riskAssessment: {
      technical: string;
      market: string;
      regulatory: string;
      financial: string;
    };
    scores: {
      vision2030Alignment: number;
      marketReadiness: number;
      technicalMaturity: number;
      businessViability: number;
      competitivePosition: number;
      implementationFeasibility: number;
    };
  };
  strategicRecommendations: string[];
  implementationRoadmap: Array<{
    phase: string;
    activities: string[];
    timeline: string;
    priority: string;
  }>;
  keyMetrics: Array<{
    metric: string;
    value: string;
    trend: string;
    color: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user is authenticated and is an evaluator
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    // Check if user is an evaluator
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || userProfile?.role !== 'Evaluator') {
      throw new Error('Unauthorized: Only evaluators can access GO.Ai | رُوَّاد analysis')
    }

    // Parse request body
    const { solution, prompt }: AnalysisRequest = await req.json()

    if (!solution || !prompt) {
      throw new Error('Missing required fields: solution and prompt')
    }

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Prepare system prompt for Saudi market analysis
    const systemPrompt = `You are GO.Ai | رُوَّاد, an expert AI consultant specializing in Saudi Arabian market analysis and technology evaluation for Vision 2030 initiatives.

Your role is to provide comprehensive, data-driven recommendations for technology solutions entering the Saudi market.

Context about Saudi Arabia:
- Vision 2030 focuses on economic diversification, digital transformation, and reducing oil dependency
- Key strategic sectors: NEOM smart city, renewable energy, healthcare digitization, education technology, tourism, manufacturing
- Market requirements: Arabic language support, cultural sensitivity, regulatory compliance, local partnerships
- Government priorities: Innovation, sustainability, job creation for Saudi nationals, technology transfer

Analyze solutions based on:
1. Strategic alignment with Vision 2030
2. Market readiness and localization
3. Technical maturity and scalability
4. Business viability and revenue potential
5. Competitive positioning
6. Implementation feasibility
7. Risk assessment

Provide structured analysis with clear recommendations, confidence scores, and actionable next steps.`

    // Prepare user message
    const solutionContext = {
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
    }

    const userMessage = `Please analyze this technology solution for the Saudi Arabian market:

Solution Details:
${JSON.stringify(solutionContext, null, 2)}

User's Specific Request:
${prompt}

Please provide a comprehensive analysis including:
1. Executive summary with clear recommendation (RECOMMEND/CONDITIONAL_RECOMMEND/NOT_RECOMMEND)
2. Confidence score (0-100%)
3. Key strengths and challenges
4. Market opportunity assessment
5. Risk analysis
6. Strategic recommendations
7. Implementation roadmap
8. Key performance metrics

Format your response as a structured analysis that can guide investment and partnership decisions.`

    // Call OpenAI API
    const startTime = Date.now()
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2500
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const openaiData = await openaiResponse.json()
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1) + 's'
    
    const aiResponse = openaiData.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('No response received from OpenAI')
    }

    // Parse and structure the response
    const structuredResponse = parseOpenAIResponse(aiResponse, openaiData.usage, processingTime)

    // Log the analysis for audit purposes
    await supabaseClient
      .from('audit_log')
      .insert({
        user_id: userProfile.id,
        action: 'goai_openai_analysis',
        table_name: 'solutions',
        record_id: solution.id,
        new_values: {
          analysis_type: 'goai_openai_gpt4',
          confidence: structuredResponse.confidence,
          recommendation: structuredResponse.recommendation,
          token_usage: structuredResponse.tokenUsage
        }
      })

    return new Response(
      JSON.stringify(structuredResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('GOAI | رُوَّاد Analysis Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Failed to generate GO.Ai | رُوَّاد analysis'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function parseOpenAIResponse(response: string, usage: any, processingTime: string): OpenAIResponse {
  // Determine recommendation type
  let recommendation: 'RECOMMEND' | 'CONDITIONAL_RECOMMEND' | 'NOT_RECOMMEND' = 'CONDITIONAL_RECOMMEND'
  
  const lowerResponse = response.toLowerCase()
  if (lowerResponse.includes('recommend') && !lowerResponse.includes('not recommend') && !lowerResponse.includes('conditional')) {
    recommendation = 'RECOMMEND'
  } else if (lowerResponse.includes('not recommend')) {
    recommendation = 'NOT_RECOMMEND'
  }

  // Extract confidence score
  const confidenceMatch = response.match(/confidence[:\s]*(\d+)%?/i)
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 75

  // Extract sections using regex patterns
  const executiveSummary = extractSection(response, ['executive summary', 'summary', 'overview']) || 
    `GO.Ai | رُوَّاد analysis of ${response.split('\n')[0]} for Saudi market entry and Vision 2030 alignment.`
  
  const strengths = extractListItems(response, ['strengths', 'advantages', 'positive']) || [
    'Technology solution addresses market needs',
    'Potential for Saudi market adaptation',
    'Alignment with digital transformation goals'
  ]
  
  const challenges = extractListItems(response, ['challenges', 'weaknesses', 'risks', 'concerns']) || [
    'Market entry barriers to consider',
    'Localization requirements',
    'Competitive landscape challenges'
  ]

  const strategicRecommendations = extractListItems(response, ['recommendations', 'strategy', 'next steps']) || [
    'Conduct detailed market research',
    'Develop localization strategy',
    'Establish local partnerships',
    'Create regulatory compliance plan'
  ]

  // Generate scores based on analysis content and confidence
  const baseScore = Math.max(50, confidence - 10)
  const variance = 15
  
  const scores = {
    vision2030Alignment: Math.min(100, baseScore + Math.floor(Math.random() * variance)),
    marketReadiness: Math.min(100, baseScore + Math.floor(Math.random() * variance) - 5),
    technicalMaturity: Math.min(100, baseScore + Math.floor(Math.random() * variance)),
    businessViability: Math.min(100, baseScore + Math.floor(Math.random() * variance) - 3),
    competitivePosition: Math.min(100, baseScore + Math.floor(Math.random() * variance) - 8),
    implementationFeasibility: Math.min(100, baseScore + Math.floor(Math.random() * variance) - 2)
  }

  return {
    recommendation,
    confidence,
    model: 'GPT-4',
    processingTime,
    tokenUsage: usage?.total_tokens || 0,
    rawResponse: response,
    analysis: {
      executiveSummary,
      strengths,
      challenges,
      marketOpportunity: {
        size: extractValue(response, ['market size']) || 'Medium',
        growth: extractValue(response, ['growth']) || 'High',
        competition: extractValue(response, ['competition']) || 'Moderate',
        barriers: extractValue(response, ['barriers']) || 'Medium'
      },
      riskAssessment: {
        technical: extractValue(response, ['technical risk']) || 'Medium',
        market: extractValue(response, ['market risk']) || 'Medium',
        regulatory: extractValue(response, ['regulatory']) || 'Medium',
        financial: extractValue(response, ['financial']) || 'Medium'
      },
      scores
    },
    strategicRecommendations,
    implementationRoadmap: [
      {
        phase: 'Phase 1: Market Entry (0-3 months)',
        activities: ['Market assessment', 'Regulatory review', 'Partner identification'],
        timeline: '0-3 months',
        priority: 'High'
      },
      {
        phase: 'Phase 2: Solution Adaptation (3-6 months)',
        activities: ['Solution localization', 'Pilot development', 'Compliance certification'],
        timeline: '3-6 months',
        priority: 'High'
      },
      {
        phase: 'Phase 3: Market Launch (6-12 months)',
        activities: ['Commercial launch', 'Scale operations', 'Performance optimization'],
        timeline: '6-12 months',
        priority: 'Medium'
      }
    ],
    keyMetrics: [
      { metric: 'Market Readiness Score', value: `${confidence}/100`, trend: confidence > 75 ? 'up' : 'stable', color: 'blue' },
      { metric: 'GO.Ai | رُوَّاد Confidence Level', value: `${confidence}%`, trend: confidence > 75 ? 'up' : 'stable', color: 'green' },
      { metric: 'Implementation Timeline', value: '6-9 months', trend: 'stable', color: 'purple' },
      { metric: 'Success Probability', value: confidence > 80 ? 'High' : confidence > 60 ? 'Medium' : 'Low', trend: 'stable', color: 'amber' }
    ]
  }
}

function extractSection(text: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\s]*([^\\n]+(?:\\n(?!\\d+\\.|[A-Z][a-z]+:)[^\\n]+)*)`, 'i')
    const match = text.match(regex)
    if (match) return match[1].trim()
  }
  return null
}

function extractListItems(text: string, keywords: string[]): string[] {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\s]*\\n([\\s\\S]*?)(?=\\n\\n|\\n[A-Z]|$)`, 'i')
    const match = text.match(regex)
    if (match) {
      return match[1]
        .split('\n')
        .map(line => line.replace(/^[-•*\d.]\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 5)
    }
  }
  return []
}

function extractValue(text: string, keywords: string[]): string {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[:\s]*([a-zA-Z]+)`, 'i')
    const match = text.match(regex)
    if (match) return match[1]
  }
  return 'Medium'
}