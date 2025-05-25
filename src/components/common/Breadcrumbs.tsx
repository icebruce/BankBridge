import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

interface BreadcrumbsItem {
  label: string;
  path?: string;
  icon?: any;
}

interface BreadcrumbsProps {
  items: BreadcrumbsItem[];
  onBack?: () => void;
  showBackButton?: boolean;
  separator?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ 
  items, 
  onBack, 
  showBackButton = false,
  separator = ">"
}) => {
  return (
    <div className="flex items-center mb-2 text-sm">
      {showBackButton && onBack && (
        <button 
          onClick={onBack}
          className="flex items-center text-neutral-600 hover:text-neutral-900 mr-3"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
      )}
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="mx-2 text-neutral-400">{separator}</span>}
          {index === items.length - 1 ? (
            <span className="text-neutral-900 flex items-center">
              {item.icon && <FontAwesomeIcon icon={item.icon} className="mr-2" />}
              {item.label}
            </span>
          ) : (
            <span 
              className="text-neutral-600 flex items-center cursor-pointer hover:text-neutral-900"
              onClick={() => item.path && window.history.pushState({}, '', item.path)}
            >
              {item.icon && <FontAwesomeIcon icon={item.icon} className="mr-2" />}
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs; 