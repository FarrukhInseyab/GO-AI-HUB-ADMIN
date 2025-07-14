import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex overflow-x-auto py-2 hide-scrollbar" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 rtl:space-x-reverse flex-nowrap">
        {items.map((item, index) => (
          <li key={index} className="flex items-center whitespace-nowrap">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-teal-300 mx-2 flex-shrink-0 rtl:rotate-180" />
            )}
            {item.href ? (
              <Link
                to={item.href}
                className="text-sm font-medium text-teal-300 hover:text-teal-100 transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-sm font-medium text-teal-100 truncate max-w-[150px] sm:max-w-none">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;