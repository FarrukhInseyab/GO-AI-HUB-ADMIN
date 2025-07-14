import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Mail, 
  Calendar, 
  Activity, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Building2,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Edit3,
  Save,
  X,
  Brain,
  Users,
  Zap,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Breadcrumb from '../components/ui/Breadcrumb';

const MyProfilePage: React.FC = () => {
  const { user, refreshSession } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [activities, setActivities] = useState({
    evaluations: [],
    leadConversions: [],
    recentActivity: []
  });
  const [stats, setStats] = useState({
    totalEvaluations: 0,
    technicalEvaluations: 0,
    businessEvaluations: 0,
    approvedEvaluations: 0,
    rejectedEvaluations: 0,
    clarificationRequests: 0,
    leadsConverted: 0,
    avgEvaluationTime: null as number | null,
    joinDate: null as string | null
  });

  useEffect(() => {
    if (user) {
      setEditedName(user.contact_name);
      fetchEvaluatorActivities();
    }
  }, [user]);

  const fetchEvaluatorActivities = async () => {
    if (!supabase || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch technical evaluations performed by this user
      const { data: techEvals, error: techError } = await supabase
        .from('solutions')
        .select('id, solution_name, company_name, tech_approval_status, tech_feedback, updated_at, created_at')
        .eq('technical_eval_id', user.id)
        .order('updated_at', { ascending: false });

      // Fetch business evaluations performed by this user
      const { data: businessEvals, error: businessError } = await supabase
        .from('solutions')
        .select('id, solution_name, company_name, business_approval_status, business_feedback, updated_at, created_at')
        .eq('business_eval_id', user.id)
        .order('updated_at', { ascending: false });

      // Fetch lead conversions (interests initiated by this user)
      const { data: leadConversions, error: leadsError } = await supabase
        .from('interests')
        .select(`
          id,
          company_name,
          contact_name,
          contact_email,
          message,
          status,
          comments,
          created_at,
          initiated_at,
          solutions (
            id,
            solution_name,
            company_name
          )
        `)
        .eq('Evaluator_id', user.id)
        .eq('status', 'Lead Initiated')
        .order('initiated_at', { ascending: false });

      if (techError || businessError || leadsError) {
        console.error('Error fetching data:', { techError, businessError, leadsError });
      }

      // Combine and process evaluations
      const allEvaluations = [
        ...(techEvals || []).map(evaluation => ({ 
          ...evaluation, 
          type: 'technical',
          status: evaluation.tech_approval_status,
          feedback: evaluation.tech_feedback
        })),
        ...(businessEvals || []).map(evaluation => ({ 
          ...evaluation, 
          type: 'business',
          status: evaluation.business_approval_status,
          feedback: evaluation.business_feedback
        }))
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      // Calculate statistics
      const totalEvaluations = allEvaluations.length;
      const technicalEvaluations = techEvals?.length || 0;
      const businessEvaluations = businessEvals?.length || 0;
      
      const approvedEvaluations = allEvaluations.filter(e => e.status === 'approved').length;
      const rejectedEvaluations = allEvaluations.filter(e => e.status === 'rejected').length;
      const clarificationRequests = allEvaluations.filter(e => e.status === 'needs_clarification').length;
      
      const leadsConverted = leadConversions?.length || 0;

      // Calculate average evaluation time (from solution creation to evaluation)
      let avgEvaluationTime = null;
      const evaluatedSolutions = allEvaluations.filter(e => e.created_at && e.updated_at);
      
      if (evaluatedSolutions.length > 0) {
        const totalEvaluationTime = evaluatedSolutions.reduce((sum, evaluation) => {
          const createdAt = new Date(evaluation.created_at);
          const evaluatedAt = new Date(evaluation.updated_at);
          const evaluationTimeHours = (evaluatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          return sum + evaluationTimeHours;
        }, 0);
        avgEvaluationTime = totalEvaluationTime / evaluatedSolutions.length;
      }

      // Create recent activity timeline
      const recentActivity = [
        ...allEvaluations.map(e => ({
          type: 'evaluation',
          title: `Evaluated ${e.type} aspects of: ${e.solution_name}`,
          subtitle: `Company: ${e.company_name}`,
          date: e.updated_at,
          status: e.status,
          data: e
        })),
        ...(leadConversions || []).map(l => ({
          type: 'lead_conversion',
          title: `Converted interest to lead: ${l.solutions?.solution_name}`,
          subtitle: `Contact: ${l.contact_name} from ${l.company_name}`,
          date: l.initiated_at,
          status: 'Lead Initiated',
          data: l
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
       .slice(0, 20); // Show last 20 activities

      setActivities({
        evaluations: allEvaluations,
        leadConversions: leadConversions || [],
        recentActivity
      });

      setStats({
        totalEvaluations,
        technicalEvaluations,
        businessEvaluations,
        approvedEvaluations,
        rejectedEvaluations,
        clarificationRequests,
        leadsConverted,
        avgEvaluationTime,
        joinDate: user.created_at
      });

    } catch (error) {
      console.error('Error fetching evaluator activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !supabase) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ contact_name: editedName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      await refreshSession();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validate inputs
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Validate new password strength
    const validation = validatePassword(passwordData.newPassword);
    if (!validation.isValid) {
      setPasswordError(validation.errors.join('. '));
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: passwordData.currentPassword
      });

      if (verifyError) {
        setPasswordError('Current password is incorrect');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        setPasswordError(updateError.message);
        return;
      }

      setPasswordSuccess('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);

    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'needs_clarification':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'in_review':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'Lead Initiated':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'needs_clarification':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'in_review':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Lead Initiated':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatEvaluationTime = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} ${t('common.minutes')}`;
    } else if (hours < 24) {
      return `${Math.round(hours)} ${t('common.hours')}`;
    } else {
      const days = Math.round(hours / 24);
      return `${days} ${t('common.days')}`;
    }
  };

  const getEvaluationTypeIcon = (type: string) => {
    return type === 'technical' ? <Brain className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />;
  };

  const breadcrumbItems = [
    { label: t('navigation.profile') }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-gradient flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-app-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-teal-50 rounded-xl">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile Not Found</h2>
            <p className="text-gray-500">Unable to load profile information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <Breadcrumb items={breadcrumbItems} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary mt-4">{t('navigation.profile')}</h1>
          <p className="text-white text-base sm:text-lg">View and manage your evaluator profile and activity history</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="xl:col-span-1 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <h2 className="text-lg font-semibold text-gradient-primary">Evaluator Profile</h2>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      leftIcon={<Edit3 className="h-4 w-4" />}
                    >
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedName(user.contact_name);
                        }}
                        leftIcon={<X className="h-4 w-4" />}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveProfile}
                        leftIcon={<Save className="h-4 w-4" />}
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mb-4 sm:mb-0 sm:mr-4 shadow-lg mx-auto sm:mx-0">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    {isEditing ? (
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="text-lg font-semibold"
                      />
                    ) : (
                      <h3 className="text-lg font-semibold text-gray-900">{user.contact_name}</h3>
                    )}
                    <p className="text-sm text-teal-600 font-medium capitalize">Solution Evaluator</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-teal-500 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{user.email}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-teal-500 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Evaluator since {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <Target className="h-4 w-4 text-teal-500 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Technical & Business Evaluation Specialist
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password Management */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <h3 className="text-lg font-semibold text-gradient-secondary flex items-center">
                    <Lock className="h-5 w-5 mr-2 text-purple-600" />
                    Security
                  </h3>
                  {!isChangingPassword && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                      leftIcon={<Lock className="h-4 w-4" />}
                    >
                      Change Password
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {!isChangingPassword ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Lock className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-sm text-gray-600">Your password is secure</p>
                    <p className="text-xs text-gray-500 mt-1">Last updated: Never</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {passwordError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{passwordError}</p>
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600">{passwordSuccess}</p>
                      </div>
                    )}

                    <div className="relative">
                      <Input
                        label="Current Password"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter your current password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        label="New Password"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter your new password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        label="Confirm New Password"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm your new password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-100">
                      <p className="text-sm font-medium text-teal-800 mb-1">Password Requirements:</p>
                      <ul className="text-xs text-teal-700 space-y-1">
                        <li>• At least 8 characters long</li>
                        <li>• One uppercase letter</li>
                        <li>• One lowercase letter</li>
                        <li>• One number</li>
                        <li>• One special character</li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                          setPasswordError('');
                          setPasswordSuccess('');
                        }}
                        leftIcon={<X className="h-4 w-4" />}
                        fullWidth
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handlePasswordChange}
                        leftIcon={<Save className="h-4 w-4" />}
                        disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        fullWidth
                      >
                        Update Password
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Evaluation Statistics */}
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <h3 className="text-lg font-semibold text-gradient-primary">Evaluation Statistics</h3>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="text-xl sm:text-2xl font-bold text-gradient-primary arabic-numerals">{stats.totalEvaluations}</div>
                    <div className="text-xs text-teal-700">Total Evaluations</div>
                  </div>
                  
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="text-xl sm:text-2xl font-bold text-gradient-secondary arabic-numerals">{stats.leadsConverted}</div>
                    <div className="text-xs text-emerald-700">Leads Converted</div>
                  </div>
                  
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="text-xl sm:text-2xl font-bold text-gradient-secondary arabic-numerals">{stats.technicalEvaluations}</div>
                    <div className="text-xs text-purple-700">Technical Reviews</div>
                  </div>
                  
                  <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="text-xl sm:text-2xl font-bold text-gradient-secondary arabic-numerals">{stats.businessEvaluations}</div>
                    <div className="text-xs text-amber-700">Business Reviews</div>
                  </div>
                </div>

                {stats.avgEvaluationTime && (
                  <div className="mt-4 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-teal-50 rounded-lg text-center shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="text-lg font-bold text-gradient-primary">
                      {formatEvaluationTime(stats.avgEvaluationTime)}
                    </div>
                    <div className="text-xs text-gray-500">Avg Evaluation Time</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <div className="xl:col-span-2 space-y-6">
            {/* Evaluation Performance Overview */}
            {stats.totalEvaluations > 0 && (
              <Card className="shadow-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50">
                  <h3 className="text-lg font-semibold text-gradient-primary flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-teal-600" />
                    Evaluation Performance
                  </h3>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <div className="text-lg sm:text-xl font-bold text-gradient-secondary arabic-numerals">{stats.approvedEvaluations}</div>
                      <div className="text-xs text-emerald-700">Approved</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <div className="text-lg sm:text-xl font-bold text-gradient-secondary arabic-numerals">{stats.clarificationRequests}</div>
                      <div className="text-xs text-amber-700">Clarifications</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                      <div className="text-lg sm:text-xl font-bold text-gradient-secondary arabic-numerals">{stats.rejectedEvaluations}</div>
                      <div className="text-xs text-red-700">Rejected</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {activities.evaluations.slice(0, 3).map((evaluation) => (
                      <div key={`${evaluation.id}-${evaluation.type}`} className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-teal-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:translate-x-1">
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="p-2 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full mr-3 shadow-md flex-shrink-0">
                            {getEvaluationTypeIcon(evaluation.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-900 truncate">{evaluation.solution_name}</h4>
                            <p className="text-sm text-gray-500 truncate">{evaluation.company_name} • {evaluation.type} evaluation</p>
                          </div>
                        </div>
                        <div className={`px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm ${getStatusColor(evaluation.status)} flex-shrink-0`}>
                          {evaluation.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lead Conversion Activity */}
            {stats.leadsConverted > 0 && (
              <Card className="shadow-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
                  <h3 className="text-lg font-semibold text-gradient-secondary flex items-center">
                    <Users className="h-5 w-5 mr-2 text-emerald-600" />
                    Lead Conversion Activity
                  </h3>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    {activities.leadConversions.slice(0, 3).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:translate-x-1">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 truncate">{lead.solutions?.solution_name}</h4>
                          <p className="text-sm text-gray-500 truncate">
                            {lead.contact_name} from {lead.company_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Converted on {new Date(lead.initiated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200 shadow-sm flex-shrink-0">
                          Lead Initiated
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="shadow-xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                <h3 className="text-lg font-semibold text-gradient-primary flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-teal-600" />
                  Recent Evaluator Activity
                </h3>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {activities.recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent evaluation activity</p>
                    <p className="text-sm mt-2">Start evaluating solutions to see your activity here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-teal-50 transition-colors duration-200 shadow-sm hover:shadow-md">
                        <div className="flex-shrink-0 mt-1">
                          {activity.type === 'evaluation' ? (
                            <div className="p-2 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full shadow-md">
                              {getEvaluationTypeIcon(activity.data.type)}
                            </div>
                          ) : (
                            <div className="p-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-md">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{activity.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{activity.subtitle}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center mt-1 space-y-1 sm:space-y-0 sm:space-x-2">
                            <span className="text-xs text-gray-500">
                              {new Date(activity.date).toLocaleDateString()} at{' '}
                              {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border shadow-sm ${getStatusColor(activity.status)} self-start sm:self-auto`}>
                              {activity.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;