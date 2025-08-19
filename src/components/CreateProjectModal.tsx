import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, icon: string, color: string) => void;
}

const projectIcons = ['🚀', '💡', '📱', '🌟', '🎯', '⚡', '🔥', '💎', '🌈', '🎨', '📊', '🔧'];
const projectColors = [
  '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#10B981', '#EC4899',
  '#6366F1', '#84CC16', '#F97316', '#06B6D4', '#8B5A2B', '#374151'
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(projectIcons[0]);
  const [selectedColor, setSelectedColor] = useState(projectColors[0]);

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name, description, selectedIcon, selectedColor);
      setName('');
      setDescription('');
      setSelectedIcon(projectIcons[0]);
      setSelectedColor(projectColors[0]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl`}
        style={{ backgroundColor: isDark ? '#111111' : '#ffffff' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Create New Project</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors`}
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1f2937' : '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Project Name */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent`}
              style={{ 
                borderColor: isDark ? '#4b5563' : '#e5e7eb',
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your project"
              rows={3}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent`}
              style={{ 
                borderColor: isDark ? '#4b5563' : '#e5e7eb',
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                color: isDark ? '#ffffff' : '#000000'
              }}
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
              Project Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {projectIcons.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`p-3 rounded-lg text-xl transition-colors ${
                    selectedIcon === icon ? `ring-2 ring-gray-500` : ''
                  }`}
                  style={{ 
                    backgroundColor: selectedIcon === icon 
                      ? (isDark ? '#1f2937' : '#f3f4f6')
                      : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedIcon !== icon) {
                      e.currentTarget.style.backgroundColor = isDark ? '#1f2937' : '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedIcon !== icon) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
              Project Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {projectColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    selectedColor === color ? 'ring-2 ring-gray-500 ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className={`p-4 rounded-lg`} style={{ backgroundColor: isDark ? '#1f2937' : '#f9fafb' }}>
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: selectedColor }}
              >
                {selectedIcon}
              </div>
              <div>
                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {name || 'Project Name'}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {description || 'Project description'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors`}
            style={{ 
              color: isDark ? '#d1d5db' : '#374151',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1f2937' : '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Project
          </button>
        </div>
      </motion.div>
    </div>
  );
};