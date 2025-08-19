import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, Image, FileText, Download, Trash2, Search } from 'lucide-react';
import { Project } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface FilesTabProps {
  project: Project;
}

const fileTypeIcons = {
  image: Image,
  document: FileText,
  default: File,
};

const mockFiles = [
  {
    id: '1',
    name: 'project-mockup.png',
    type: 'image',
    size: '2.4 MB',
    uploadedAt: new Date(),
    url: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg',
  },
  {
    id: '2',
    name: 'requirements.pdf',
    type: 'document',
    size: '847 KB',
    uploadedAt: new Date(),
    url: '#',
  },
  {
    id: '3',
    name: 'user-research.docx',
    type: 'document',
    size: '1.2 MB',
    uploadedAt: new Date(),
    url: '#',
  },
];

export const FilesTab: React.FC<FilesTabProps> = ({ project }) => {
  const { isDark } = useTheme();
  const [files] = useState(mockFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Handle file drop
    const droppedFiles = Array.from(e.dataTransfer.files);
    console.log('Files dropped:', droppedFiles);
  };

  const formatFileSize = (size: string) => size;

  const getFileIcon = (type: string) => {
    const IconComponent = fileTypeIcons[type as keyof typeof fileTypeIcons] || fileTypeIcons.default;
    return IconComponent;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-6 border-b`} style={{ 
        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Files</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{files.length} files uploaded</p>
          </div>
          
          <label className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 cursor-pointer font-medium shadow-sm hover:shadow-md">
            <Upload size={16} className="mr-2" />
            Upload Files
            <input type="file" multiple className="hidden" />
          </label>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500`} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
            style={{ 
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: isDark ? '#ffffff' : '#000000'
            }}
          />
        </div>
      </div>

      {/* Drop Zone */}
      <div className={`flex-1 p-6`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
        <div
          className={`h-full rounded-2xl border-2 border-dashed transition-all duration-200 ${
            dragOver
              ? `border-blue-400 bg-blue-50/50`
              : ``
          }`}
          style={{
            backgroundColor: dragOver 
              ? (isDark ? '#1e3a8a' : '#dbeafe')
              : (isDark ? '#1a1a1a' : '#ffffff'),
            borderColor: dragOver 
              ? (isDark ? '#3b82f6' : '#60a5fa')
              : (isDark ? '#2a2a2a' : '#e2e8f0')
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {filteredFiles.length > 0 ? (
            <div className="p-6">
              {/* File Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFiles.map((file) => {
                  const FileIcon = getFileIcon(file.type);
                  
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      className={`p-6 rounded-2xl shadow-sm border hover:shadow-md transition-all duration-200 group`}
                      style={{ 
                        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                        borderColor: isDark ? '#1e293b' : '#e2e8f0'
                      }}
                    >
                      {file.type === 'image' ? (
                        <div className={`aspect-square mb-4 rounded-xl overflow-hidden`} style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }}>
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`aspect-square mb-4 rounded-xl flex items-center justify-center`} style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }}>
                          <FileIcon size={40} className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm truncate group-hover:text-blue-500 transition-colors`} title={file.name}>
                          {file.name}
                        </h4>
                        <div className={`flex items-center justify-between text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <span className="font-medium">{formatFileSize(file.size)}</span>
                          <span>{file.uploadedAt.toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <button className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all duration-200 border font-medium text-sm`}
                            style={{ 
                              backgroundColor: 'transparent',
                              borderColor: isDark ? '#1e293b' : '#e2e8f0',
                              color: isDark ? '#d1d5db' : '#374151'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#e2e8f0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Download size={14} className="mr-1" />
                            Download
                          </button>
                          <button className={`p-2 text-red-500 rounded-lg transition-all duration-200 border border-red-200 hover:bg-red-50`}
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#7f1d1d' : '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`h-full flex flex-col items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`w-20 h-20 rounded-2xl mb-6 flex items-center justify-center`} style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
                <Upload className="w-10 h-10 opacity-30" />
              </div>
              <p className="text-xl font-semibold mb-2">
                {searchTerm ? 'No files found' : 'No files uploaded yet'}
              </p>
              <p className="text-sm text-center mb-8 max-w-md">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Drag and drop files here, or click the upload button to get started'
                }
              </p>
              {!searchTerm && (
                <label className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 cursor-pointer font-medium shadow-sm hover:shadow-md">
                  <Upload size={18} className="mr-2" />
                  Choose Files
                  <input type="file" multiple className="hidden" />
                </label>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};