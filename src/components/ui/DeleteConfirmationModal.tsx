import React from 'react';
import { FiTrash, FiX } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative max-w-md w-full mx-4 rounded-lg shadow-2xl ${
        isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              isDark ? 'bg-red-900/50' : 'bg-red-100'
            }`}>
              <FiTrash className={`w-5 h-5 ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              isDark 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className={`text-sm ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {message}
          </p>
          {itemName && (
            <div className={`mt-3 p-3 rounded-lg ${
              isDark ? 'bg-gray-900 border border-gray-700' : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className={`font-medium text-sm ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                "{itemName}"
              </p>
            </div>
          )}
          <p className={`mt-3 text-xs font-medium ${
            isDark ? 'text-red-400' : 'text-red-600'
          }`}>
            This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className={`flex justify-end space-x-3 p-6 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isDark 
                ? 'bg-red-900 hover:bg-red-800 text-red-200' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};