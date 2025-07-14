import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Building2, Mail, Calendar, Users, MessageSquare, ArrowRight, Filter, SortAsc, SortDesc, X, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

type SortOption = 'name' | 'company' | 'joined' | 'solutions' | 'interests' | 'country';
type FilterOption = 'all' | 'has_solutions' | 'has_interests' | 'active' | 'inactive';

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('joined');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInterests: 0,
    totalSolutions: 0,
    activeCustomers: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterAndSortCustomers();
  }, [customers, searchTerm, sortBy, sortOrder, filterBy]);

  const fetchCustomers = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch users with role 'User' (customers)
      let { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          contact_name,
          company_name,
          country,
          created_at
        `)
        .eq('role', 'User');

      if (usersError?.message.includes('JWT expired')) {
        await refreshSession();
        ({ data: users, error: usersError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            contact_name,
            company_name,
            country,
            created_at
          `)
          .eq('role', 'User'));
      }

      if (usersError) throw usersError;

      // For each user, fetch their solutions and interests
      const customersWithDetails = await Promise.all((users || []).map(async (user) => {
        // Fetch solutions count
        const { data: solutions, error: solutionsError } = await supabase
          .from('solutions')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        // Fetch interests count and latest activity
        const { data: interests, error: interestsError } = await supabase
          .from('interests')
          .select('id, created_at', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (solutionsError || interestsError) {
          console.error('Error fetching counts:', { solutionsError, interestsError });
        }

        const solutionsCount = solutions?.length || 0;
        const interestsCount = interests?.length || 0;
        const lastActivity = interests && interests.length > 0 ? interests[0].created_at : user.created_at;
        
        // Determine if customer is active (has activity in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isActive = new Date(lastActivity) > thirtyDaysAgo;

        return {
          ...user,
          solutions_count: solutionsCount,
          interests_count: interestsCount,
          last_activity: lastActivity,
          is_active: isActive
        };
      }));

      // Calculate stats
      const stats = {
        totalCustomers: customersWithDetails.length,
        totalSolutions: customersWithDetails.reduce((sum, customer) => sum + customer.solutions_count, 0),
        totalInterests: customersWithDetails.reduce((sum, customer) => sum + customer.interests_count, 0),
        activeCustomers: customersWithDetails.filter(customer => customer.is_active).length
      };

      setCustomers(customersWithDetails);
      setStats(stats);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortCustomers = () => {
    let filtered = customers.filter(customer => {
      // Search filter
      const matchesSearch = 
        customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.country?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Category filter
      switch (filterBy) {
        case 'has_solutions':
          return customer.solutions_count > 0;
        case 'has_interests':
          return customer.interests_count > 0;
        case 'active':
          return customer.is_active;
        case 'inactive':
          return !customer.is_active;
        case 'all':
        default:
          return true;
      }
    });

    // Sort customers
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.contact_name?.localeCompare(b.contact_name || '') || 0;
          break;
        case 'company':
          comparison = a.company_name.localeCompare(b.company_name);
          break;
        case 'country':
          comparison = (a.country || '').localeCompare(b.country || '');
          break;
        case 'joined':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'solutions':
          comparison = a.solutions_count - b.solutions_count;
          break;
        case 'interests':
          comparison = a.interests_count - b.interests_count;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredCustomers(filtered);
  };

  const handleCustomerClick = (customerId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/customers/${customerId}`);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterBy('all');
    setSortBy('joined');
    setSortOrder('desc');
  };

  const hasActiveFilters = searchTerm || filterBy !== 'all' || sortBy !== 'joined' || sortOrder !== 'desc';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-gradient flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary">{t('customers.title')}</h1>
          <p className="text-white text-base sm:text-lg">{t('customers.subtitle')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">{t('customers.totalCustomers')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gradient-primary arabic-numerals">{stats.totalCustomers}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl shadow-lg flex-shrink-0">
                  <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Active Customers</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gradient-primary arabic-numerals">{stats.activeCustomers}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg flex-shrink-0">
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">{t('businessInterest.totalInterests')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gradient-primary arabic-numerals">{stats.totalInterests}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg flex-shrink-0">
                  <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-shadow duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">{t('solutions.title')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gradient-primary arabic-numerals">{stats.totalSolutions}</p>
                </div>
                <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl shadow-lg flex-shrink-0">
                  <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="mb-6 sm:mb-8 shadow-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <h2 className="text-lg font-semibold text-gradient-primary">
                {t('customers.allCustomers')} ({filteredCustomers.length})
              </h2>
              
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                {/* Search */}
                <div className="flex-1 min-w-0 sm:min-w-64">
                  <Input
                    placeholder={t('customers.searchCustomers')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-4 w-4" />}
                    fullWidth
                  />
                </div>
                
                {/* Filter Controls */}
                <div className="flex space-x-2">
                  {/* Category Filter */}
                  <select
                    className="flex-1 sm:flex-none border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white min-w-32 transition-all duration-200"
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                  >
                    <option value="all">All Customers</option>
                    <option value="active">Active (30 days)</option>
                    <option value="inactive">Inactive</option>
                    <option value="has_solutions">Has Solutions</option>
                    <option value="has_interests">Has Interests</option>
                  </select>
                  
                  {/* Sort By */}
                  <select
                    className="flex-1 sm:flex-none border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white min-w-32 transition-all duration-200"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                  >
                    <option value="joined">Date Joined</option>
                    <option value="name">Contact Name</option>
                    <option value="company">Company Name</option>
                    <option value="country">Country</option>
                    <option value="solutions">Solutions Count</option>
                    <option value="interests">Interests Count</option>
                  </select>
                  
                  {/* Sort Order */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSortOrder}
                    leftIcon={sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                    className="flex-shrink-0"
                  />
                  
                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      leftIcon={<X className="h-4 w-4" />}
                      className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                    >
                      <span className="hidden sm:inline">Clear</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-teal-50 rounded-xl">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {hasActiveFilters ? 'No customers found' : 'No customers registered yet'}
                </h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  {hasActiveFilters 
                    ? 'Try adjusting your search criteria or filters'
                    : 'Customers will appear here once they register'
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredCustomers.map((customer, index) => (
                  <div
                    key={customer.id}
                    className="cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 border border-gray-200 hover:border-teal-300 group bg-gradient-to-br from-white to-gray-50 rounded-xl animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={(e) => handleCustomerClick(customer.id, e)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCustomerClick(customer.id, e as any);
                      }
                    }}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className={`p-3 rounded-xl mr-3 group-hover:bg-teal-200 transition-colors shadow-lg flex-shrink-0 ${
                            customer.is_active ? 'bg-gradient-to-br from-emerald-400 to-green-500' : 'bg-gradient-to-br from-gray-400 to-slate-500'
                          }`}>
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gradient-primary truncate">
                              {customer.company_name}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">{customer.contact_name}</p>
                            {customer.is_active && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 mt-1">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-teal-600 transition-colors flex-shrink-0 ml-2" />
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0 text-teal-500" />
                          <span className="truncate">{customer.email}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0 text-teal-500" />
                          <span className="truncate">{customer.country || 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2 flex-shrink-0 text-teal-500" />
                          <span className="truncate">
                            {t('customers.joined')} {new Date(customer.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div className="flex space-x-4 sm:space-x-6">
                          <div className="text-center">
                            <div className="text-lg font-bold text-gradient-secondary arabic-numerals">
                              {customer.solutions_count}
                            </div>
                            <div className="text-xs text-gray-500">{t('solutions.title')}</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-lg font-bold text-gradient-primary arabic-numerals">
                              {customer.interests_count}
                            </div>
                            <div className="text-xs text-gray-500">{t('solutions.interests')}</div>
                          </div>
                        </div>

                        <div className="flex items-center text-teal-600 group-hover:text-teal-700 transition-colors">
                          <span className="text-sm font-medium hidden sm:inline">View Details</span>
                        </div>
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
  );
};

export default CustomersPage;