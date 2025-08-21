import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  placeholder = "Search...",
  searchValue,
  onSearchChange
}) => {
  const { isDark } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="w-full max-w-md mx-4"
          >
            <div
              className={`rounded-2xl border shadow-xl`}
              style={{ 
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Search
                  </h3>
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="relative">
                  <Search 
                    size={20} 
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`} 
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm`}
                    style={{ 
                      borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                  />
                </div>

                <div className={`mt-4 pt-4 border-t text-xs ${
                  isDark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span>Press ESC to close</span>
                    <span>Enter to search</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};