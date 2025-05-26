import { FC, ReactNode, ButtonHTMLAttributes } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'icon' | 'back-arrow' | 'upload-box';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconDefinition;
  iconPosition?: 'left' | 'right';
  children?: ReactNode;
  className?: string; // Allow additional custom classes
}

const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getBaseClasses = () => {
    const fontWeight = variant === 'tertiary' ? 'font-normal' : 'font-medium';
    const baseClasses = `inline-flex items-center justify-center ${fontWeight} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2`;
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 hover:shadow-sm focus:ring-neutral-500 disabled:bg-neutral-400 disabled:cursor-not-allowed`;
      
      case 'secondary':
        return `${baseClasses} border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 hover:border-neutral-300 focus:ring-neutral-500 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed`;
      
      case 'tertiary':
        return `${baseClasses} bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 focus:ring-neutral-500 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed`;
      

      
      case 'icon':
        return `${baseClasses} hover:bg-neutral-100 rounded-lg text-neutral-600 hover:text-neutral-900 focus:ring-neutral-500 disabled:text-neutral-300 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-300`;
      
      case 'back-arrow':
        return `${baseClasses} text-neutral-600 hover:text-neutral-900 focus:ring-neutral-500 disabled:text-neutral-400 disabled:cursor-not-allowed`;
      
      case 'upload-box':
        return `${baseClasses} bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 hover:shadow-sm focus:ring-neutral-500 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed`;
      
      default:
        return baseClasses;
    }
  };

  const getSizeClasses = () => {
    if (variant === 'icon') {
      switch (size) {
        case 'sm': return 'p-1';
        case 'md': return 'p-1.5';
        case 'lg': return 'p-2';
        default: return 'p-1.5';
      }
    }

    if (variant === 'back-arrow') {
      return ''; // No padding for back arrow buttons
    }

    // Tertiary buttons are 25% smaller
    if (variant === 'tertiary') {
      switch (size) {
        case 'sm': return 'px-2 py-1 text-xs';
        case 'md': return 'px-3 py-1.5 text-sm';
        case 'lg': return 'px-4 py-2 text-base';
        default: return 'px-3 py-1.5 text-sm';
      }
    }

    // Standard button sizes
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm';
      case 'md': return 'px-4 py-2';
      case 'lg': return 'px-6 py-3 text-lg';
      default: return 'px-4 py-2';
    }
  };

  const getIconClasses = () => {
    if (variant === 'back-arrow') return '';
    
    // Tertiary buttons have smaller icons
    if (variant === 'tertiary') {
      switch (size) {
        case 'sm': return 'text-xs';
        case 'md': return 'text-xs';
        case 'lg': return 'text-sm';
        default: return 'text-xs';
      }
    }
    
    switch (size) {
      case 'sm': return 'text-xs';
      case 'md': return 'text-sm';
      case 'lg': return 'text-base';
      default: return 'text-sm';
    }
  };

  const getGapClasses = () => {
    if (variant === 'icon' || variant === 'back-arrow' || !children) return '';
    
    // Tertiary buttons have smaller gaps
    if (variant === 'tertiary') {
      switch (size) {
        case 'sm': return 'gap-1';
        case 'md': return 'gap-1.5';
        case 'lg': return 'gap-2';
        default: return 'gap-1.5';
      }
    }
    
    switch (size) {
      case 'sm': return 'gap-1.5';
      case 'md': return 'gap-2';
      case 'lg': return 'gap-2.5';
      default: return 'gap-2';
    }
  };

  const combinedClasses = `${getBaseClasses()} ${getSizeClasses()} ${getGapClasses()} ${className}`.trim();

  const renderIcon = () => {
    if (!icon) return null;
    return <FontAwesomeIcon icon={icon} className={getIconClasses()} />;
  };

  return (
    <button
      className={combinedClasses}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && renderIcon()}
      {children}
      {icon && iconPosition === 'right' && renderIcon()}
    </button>
  );
};

export default Button; 