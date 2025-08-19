import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Edit3, Trash2 } from 'lucide-react';
import { Project, Document } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useTheme } from '../contexts/ThemeContext';

interface DocumentsTabProps {
  project: Project;
}

const documentTypes = [
  { id: 'prd', label: 'Product Requirements', description: 'Detailed product requirements document' },
  { id: 'ux-flow', label: 'UX Flow', description: 'User experience and workflow documentation' },
  { id: 'feature-list', label: 'Feature List', description: 'Comprehensive list of features' },
  { id: 'bug-list', label: 'Bug List', description: 'Known bugs and issues' },
  { id: 'custom', label: 'Custom Document', description: 'Create a custom document' },
];

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ project }) => {
  const { documents, createDocument, updateDocument } = useSupabaseProjects();
  const { isDark } = useTheme();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<Document['type']>('custom');

  const projectDocs = documents.filter(d => d.projectId === project.id);

  const handleCreateDocument = async () => {
    if (newDocTitle.trim()) {
      const doc = await createDocument(project.id, newDocTitle, newDocType);
      setSelectedDoc(doc);
      setIsEditing(true);
      setShowCreateModal(false);
      setNewDocTitle('');
      setNewDocType('custom');
    }
  };

  const handleSaveDocument = () => {
    if (selectedDoc) {
      updateDocument(selectedDoc.id, { content: selectedDoc.content });
      setIsEditing(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Document List */}
      <div className={`w-80 border-r flex flex-col`} style={{ 
        backgroundColor: isDark ? '#111111' : '#f8fafc',
        borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
      }}>
        <div className={`p-4 border-b`} style={{ borderColor: isDark ? '#2a2a2a' : '#e2e8f0' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium transition-all duration-200 border ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 hover:border-gray-600' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <Plus size={16} className="mr-2" />
            <span>New Document</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {projectDocs.map((doc) => (
              <motion.button
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc);
                  setIsEditing(false);
                }}
                className={`w-full text-left p-3 transition-all duration-200 border-l-2 ${
                  selectedDoc?.id === doc.id
                    ? `${isDark ? 'bg-gray-800 border-l-gray-600' : 'bg-gray-100 border-l-gray-400'}`
                    : `hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-l-transparent`
                }`}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center space-x-3">
                  <FileText size={14} className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'} truncate`}>{doc.title}</div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} capitalize`}>
                        {doc.type ? doc.type.replace('-', ' ') : 'Document'}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                      <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {projectDocs.length === 0 && (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <FileText className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className="text-sm font-medium mb-1">No documents yet</p>
              <p className="text-xs">Create your first document to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Editor */}
      <div className="flex-1 flex flex-col">
        {selectedDoc ? (
          <>
            {/* Document Header */}
            <div className={`px-6 py-4 border-b`} style={{ 
              backgroundColor: isDark ? '#111111' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-1`}>{selectedDoc.title}</h2>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium border ${isDark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {selectedDoc.type ? selectedDoc.type.replace('-', ' ').toUpperCase() : 'DOCUMENT'}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      Updated {new Date(selectedDoc.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <button
                      onClick={handleSaveDocument}
                      className={`px-4 py-2 text-sm font-medium transition-all duration-200 border ${
                        isDark 
                          ? 'bg-green-900 hover:bg-green-800 text-green-200 border-green-800' 
                          : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                      }`}
                    >
                      Save Changes
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`px-4 py-2 text-sm font-medium transition-all duration-200 border flex items-center ${
                        isDark 
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700' 
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      <Edit3 size={14} className="mr-2" />
                      Edit
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div className={`flex-1 p-4`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
              {isEditing ? (
                <textarea
                  value={selectedDoc.content}
                  onChange={(e) => setSelectedDoc({ ...selectedDoc, content: e.target.value })}
                  className={`w-full h-full p-4 border resize-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 text-sm`}
                  style={{ 
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                    backgroundColor: isDark ? '#111111' : '#ffffff',
                    color: isDark ? '#e5e5e5' : '#111111'
                  }}
                  placeholder="Start writing your document..."
                />
              ) : (
                <div className={`p-4 h-full overflow-y-auto border`} style={{ 
                  backgroundColor: isDark ? '#111111' : '#ffffff',
                  borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
                }}>
                  {selectedDoc.content ? (
                    <div className="prose max-w-none">
                      <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{selectedDoc.content}</pre>
                    </div>
                  ) : (
                    <div className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      <FileText className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className="text-sm font-medium mb-2">This document is empty</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'} font-medium`}
                      >
                        Start writing
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
            <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <FileText className={`w-10 h-10 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className="text-lg font-medium mb-2">Select a document to view</p>
              <p className="text-sm">Choose from the list or create a new document</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-2xl p-6 w-full max-w-md mx-4 border`}
            style={{ 
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
            }}
          >
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>Create New Document</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Document Title
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Enter document title"
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  style={{ 
                    borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Document Type
                </label>
                <div className="space-y-3">
                  {documentTypes.map((type) => (
                    <label key={type.id} className="flex items-start space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="docType"
                        value={type.id}
                        checked={newDocType === type.id}
                        onChange={(e) => setNewDocType(e.target.value as Document['type'])}
                        className="mt-1 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} group-hover:text-blue-500 transition-colors`}>{type.label}</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-4 py-2 rounded-xl transition-colors font-medium`}
                style={{ 
                  color: isDark ? '#d1d5db' : '#374151',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={!newDocTitle.trim()}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};