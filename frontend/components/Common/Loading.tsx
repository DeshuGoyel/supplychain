import React from 'react';
import { cn } from './Button';

interface LoadingProps {
  text?: string;
  fullPage?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ text = 'Loading...', fullPage = false, className }) => {
  const content = (
    <div className={cn('flex flex-col items-center justify-center space-y-4 p-8', className)}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-blue-100"></div>
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
      {text && <p className="text-gray-500 font-medium">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
        {content}
      </div>
    );
  }

  return content;
};

export default Loading;
