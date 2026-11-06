import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * AppButton Component
 * 
 * Reusable institutional fintech button with standardized heights, corner radii,
 * accessible focus indicators, and semantic token states.
 * 
 * Sizes:
 * - sm: 32px height (h-button-sm / h-8), text-xs, px-3
 * - md: 40px height (h-button-md / h-10), text-sm, px-4
 * - lg: 48px height (h-button-lg / h-12), text-base, px-5
 * 
 * Variants:
 * - primary: solid semantic emerald, white text, no glow
 * - secondary: surface-elevated, text-primary, border-subtle
 * - outline: transparent, text-primary, border-subtle
 * - ghost: transparent, text-secondary, hover:text-primary
 * - destructive / danger: semantic red, white text
 */
export const AppButton = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  onClick,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-button transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const variantClasses = {
    primary:
      'bg-semantic-positive text-white hover:bg-emerald-600 active:bg-emerald-700 border border-transparent shadow-none',
    secondary:
      'bg-surface-elevated text-text-primary hover:bg-surface-card-hover active:bg-surface-canvas border border-border-subtle hover:border-border-strong',
    outline:
      'bg-transparent text-text-primary hover:bg-surface-elevated active:bg-surface-card-hover border border-border-subtle hover:border-border-strong',
    ghost:
      'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent',
    destructive:
      'bg-semantic-danger text-white hover:bg-red-600 active:bg-red-700 border border-transparent shadow-none',
    danger:
      'bg-semantic-danger text-white hover:bg-red-600 active:bg-red-700 border border-transparent shadow-none'
  };

  const sizeClasses = {
    sm: 'h-8 text-xs px-3 gap-1.5',
    md: 'h-10 text-sm px-4 gap-2',
    lg: 'h-12 text-base px-5 gap-2.5'
  };

  const selectedVariant = variantClasses[variant] || variantClasses.primary;
  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
          <span>{children || 'Processing...'}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          {children && <span>{children}</span>}
          {Icon && iconPosition === 'right' && (
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
        </>
      )}
    </button>
  );
};

export default AppButton;
