import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import Button from './Button';

const LanguageToggle: React.FC = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    
    // Update document direction and language
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const currentLang = i18n.language === 'ar' ? 'العربية' : 'English';
  const nextLang = i18n.language === 'ar' ? 'English' : 'العربية';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      leftIcon={<Languages className="h-4 w-4 text-teal-300" />}
      className="text-white hover:text-teal-200 hover:bg-teal-600 transition-colors duration-200 touch-target"
      title={`Switch to ${nextLang}`}
    >
      <span className="hidden sm:inline">{currentLang}</span>
    </Button>
  );
};

export default LanguageToggle;