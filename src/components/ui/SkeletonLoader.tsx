import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  isDark?: boolean;
  className?: string;
  variant?: 'text' | 'title' | 'paragraph' | 'code' | 'sidebar-item';
  lines?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  isDark = false,
  className = '',
  variant = 'text',
  lines = 1
}) => {
  const baseClasses = `animate-pulse rounded ${
    isDark ? 'bg-gray-700' : 'bg-gray-200'
  }`;

  const variants = {
    text: 'h-4 w-3/4',
    title: 'h-6 w-1/2',
    paragraph: 'h-4 w-full',
    code: 'h-20 w-full',
    'sidebar-item': 'h-8 w-full'
  };

  if (variant === 'paragraph' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`${baseClasses} ${variants.paragraph} ${
              index === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    />
  );
};