import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserCircle, LogOut, Menu, X, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import LanguageToggle from '../ui/LanguageToggle';
import { ROUTES, APP_CONFIG } from '../../utils/constants';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
      setUserDropdownOpen(false);
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    navigate(ROUTES.PROFILE);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const navigationItems = [
    { label: t('navigation.evaluatorDashboard'), href: ROUTES.HOME },
    { label: t('navigation.salesLeadsDashboard'), href: ROUTES.BUSINESS_INTEREST },
    { label: t('navigation.solutions'), href: ROUTES.SUBMISSIONS },
    { label: t('navigation.customers'), href: ROUTES.CUSTOMERS }
  ];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  return (
    <header className="bg-gradient-to-r from-teal-800 to-teal-700 shadow-lg border-b-2 border-teal-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer group"
              onClick={() => navigate(ROUTES.HOME)}
            >
              <div className="flex items-center">
                <img 
                  src="/LOGO GO AI HUB .png" 
                  alt="Admin Portal Logo" 
                  className="h-8 sm:h-10 mr-2 sm:mr-3 transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            </div>
            
            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden lg:ml-8 lg:flex lg:space-x-6 xl:space-x-8 rtl:space-x-reverse">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href} 
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-white hover:text-teal-200 hover:border-teal-300 transition-colors duration-200 whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-teal-200 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-300 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
          
          {/* Desktop user menu */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4 rtl:space-x-reverse">
            <LanguageToggle />
            {user ? (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 rtl:space-x-reverse text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-3 py-2"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
                    <UserCircle className="h-5 w-5 text-teal-100" />
                  </div>
                  <div className="flex flex-col items-start rtl:items-end text-white">
                    <span className="text-sm font-medium truncate max-w-32">{user.contact_name}</span>
                    <span className="text-xs font-medium">Evaluator</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-teal-300 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-teal-800 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-teal-700">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-teal-700 bg-gradient-to-r from-teal-800 to-teal-700">
                        <p className="text-sm font-medium text-white truncate">{user.contact_name}</p>
                        <p className="text-xs text-teal-200 truncate">{user.email}</p>
                        <p className="text-xs text-teal-100 font-medium">Evaluator</p>
                      </div>
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-white"
                      >
                        <User className="h-4 w-4 mr-3 rtl:mr-0 rtl:ml-3 text-teal-300" />
                        {t('navigation.profile')}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-white hover:text-red-300 transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4 mr-3 rtl:mr-0 rtl:ml-3 text-teal-300" />
                        {t('navigation.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4 rtl:space-x-reverse">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="border-teal-300 text-white hover:bg-teal-600"
                >
                  {t('navigation.login')}
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => navigate(ROUTES.SIGNUP)}
                  className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500 text-white"
                >
                  {t('navigation.signup')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-teal-600 bg-teal-700 shadow-lg">
          <div className="pt-2 pb-3 space-y-1">
            {user && navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="block pl-3 pr-4 py-3 border-l-4 border-transparent text-base font-medium text-white hover:bg-teal-600 hover:border-teal-300 hover:text-teal-100 rtl:border-l-0 rtl:border-r-4 transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-teal-600">
            <div className="flex items-center px-4 mb-3">
              <LanguageToggle />
            </div>
            {user ? (
              <>
                <div className="flex items-center px-4 mb-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-teal-100" />
                    </div>
                  </div>
                  <div className="ml-3 rtl:ml-0 rtl:mr-3 min-w-0">
                    <div className="text-base font-medium text-white truncate">{user.contact_name}</div>
                    <div className="text-sm font-medium text-teal-200 truncate">{user.email}</div>
                    <div className="text-sm font-medium text-teal-100">Evaluator</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link
                    to={ROUTES.PROFILE}
                    className="flex items-center px-4 py-3 text-base font-medium text-white active:text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3 text-teal-300" />
                    {t('navigation.profile')}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-3 text-base font-medium text-white hover:text-red-100 transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3 text-teal-300" />
                    {t('navigation.logout')}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1 px-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  fullWidth
                  className="mb-2 border-teal-300 text-white hover:bg-teal-600"
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  {t('navigation.login')}
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  fullWidth
                  className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-600 hover:to-teal-500"
                  onClick={() => navigate(ROUTES.SIGNUP)}
                >
                  {t('navigation.signup')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;