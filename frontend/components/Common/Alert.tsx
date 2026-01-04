import React from 'react';
import { cn } from './Button';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const variants = {
    success: {
      bg: 'bg-green-50',
      text: 'text-green-800',
      icon: <CheckCircle className="h-5 w-5 text-green-400" />,
      border: 'border-green-200',
    },
    error: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      icon: <AlertCircle className="h-5 w-5 text-red-400" />,
      border: 'border-red-200',
    },
    warning: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-800',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
      border: 'border-yellow-200',
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      icon: <Info className="h-5 w-5 text-blue-400" />,
      border: 'border-blue-200',
    },
  };

  const style = variants[variant];

  return (
    <div className={cn('rounded-md border p-4 flex gap-3', style.bg, style.border, className)}>
      <div className="flex-shrink-0">{style.icon}</div>
      <div className="flex-1">
        {title && <h3 className={cn('text-sm font-medium mb-1', style.text)}>{title}</h3>}
        <div className={cn('text-sm', style.text)}>{children}</div>
      </div>
      {onClose && (
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={cn('inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2', style.text)}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Alert;
