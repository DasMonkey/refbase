import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Search, Filter } from 'lucide-react';
import { FiTrash } from 'react-icons/fi';
import { Project, Document } from '../types';
import { useSupabaseProjects } from '../hooks/useSupabaseProjects';
import { useTheme } from '../contexts/ThemeContext';
import { EnhancedEditor } from './ui/EnhancedEditor';
import { DeleteConfirmationModal } from './ui/DeleteConfirmationModal';

// Custom sorting icons
const SortAscIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" className={className}>
    <rect x="2" y="10" width="10" height="1.5" rx="0.75" />
    <rect x="2" y="6" width="7" height="1.5" rx="0.75" />
    <rect x="2" y="2" width="4" height="1.5" rx="0.75" />
  </svg>
);

const SortDescIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" className={className}>
    <rect x="2" y="2" width="10" height="1.5" rx="0.75" />
    <rect x="2" y="6" width="7" height="1.5" rx="0.75" />
    <rect x="2" y="10" width="4" height="1.5" rx="0.75" />
  </svg>
);

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
  const { documents, createDocument, updateDocument, deleteDocument, loading } = useSupabaseProjects();
  const { isDark } = useTheme();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(() => {
    const saved = localStorage.getItem(`selectedDocument_${project.id}`);
    return saved ? { id: saved } as Document : null;
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<Document['type']>('custom');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isProjectSwitching, setIsProjectSwitching] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentProjectRef = useRef(project.id);

  // Check if filter is active (not default)
  const isFilterActive = sortBy !== 'created' || sortOrder !== 'desc';

  // Reset filter to default
  const resetFilter = () => {
    setSortBy('created');
    setSortOrder('desc');
  };

  const projectDocs = documents.filter(d => d.projectId === project.id);
  
  // Filter and sort documents based on search query and sort options
  const filteredDocs = projectDocs
    .filter(doc => 
      searchQuery === '' || 
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Handle project switching
  useEffect(() => {
    // Detect if project has changed
    if (currentProjectRef.current !== project.id) {
      setIsProjectSwitching(true);
      setSelectedDoc(null);
      setSearchQuery('');
      setShowFilterPopup(false);
      currentProjectRef.current = project.id;
      
      // Clear project switching state after a short delay
      const timer = setTimeout(() => {
        setIsProjectSwitching(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [project.id]);

  // Restore selected document when documents are loaded and project is stable
  useEffect(() => {
    if (!loading && !isProjectSwitching && documents.length > 0) {
      const savedDocId = localStorage.getItem(`selectedDocument_${project.id}`);
      if (savedDocId && (!selectedDoc || !selectedDoc.title)) {
        const doc = documents.find(d => d.id === savedDocId && d.projectId === project.id);
        if (doc) {
          setSelectedDoc(doc);
        }
      }
    }
  }, [documents, project.id, selectedDoc, loading, isProjectSwitching]);

  // Save selectedDoc to localStorage whenever it changes
  useEffect(() => {
    if (selectedDoc) {
      localStorage.setItem(`selectedDocument_${project.id}`, selectedDoc.id);
    } else {
      localStorage.removeItem(`selectedDocument_${project.id}`);
    }
  }, [selectedDoc, project.id]);

  // Reset scroll position when switching documents
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedDoc?.id]);

  const handleCreateDocument = async () => {
    if (newDocTitle.trim()) {
      const doc = await createDocument(project.id, newDocTitle, newDocType);
      setSelectedDoc(doc);
      setShowCreateModal(false);
      setNewDocTitle('');
      setNewDocType('custom');
    }
  };

  const handleSaveDocument = () => {
    if (selectedDoc) {
      updateDocument(selectedDoc.id, { 
        content: selectedDoc.content,
        language: selectedDoc.language 
      });
    }
  };

  const handleDeleteDocument = () => {
    if (selectedDoc) {
      setShowDeleteConfirmation(true);
    }
  };

  const confirmDeleteDocument = () => {
    if (selectedDoc) {
      deleteDocument(selectedDoc.id);
      setSelectedDoc(null);
      setShowDeleteConfirmation(false);
    }
  };

  const handleContentChange = (content: string) => {
    if (selectedDoc) {
      setSelectedDoc({ ...selectedDoc, content });
    }
  };

  const handleLanguageChange = (language: string) => {
    if (selectedDoc) {
      setSelectedDoc({ ...selectedDoc, language });
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Document List */}
      <div className={`w-64 border-r flex flex-col flex-shrink-0`} style={{ 
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

        <div className={`p-3`}>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search 
                size={16} 
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className={`w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                style={{ 
                  borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
                  backgroundColor: isDark ? '#111111' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000'
                }}
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowFilterPopup(!showFilterPopup)}
                className={`relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Filter size={16} />
                {isFilterActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                )}
              </button>
              
              {showFilterPopup && (
                <>
                  <div 
                    className="fixed inset-0 z-50" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFilterPopup(false);
                    }}
                  />
                  <div 
                    className="absolute top-full right-0 mt-1 w-48 rounded-lg shadow-xl z-[9999]"
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                    }}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Sort by</div>
                        {isFilterActive && (
                          <button
                            onClick={() => {
                              resetFilter();
                              setShowFilterPopup(false);
                            }}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {[
                          { key: 'name' as const, label: 'Name' },
                          { key: 'created' as const, label: 'Date Created' },
                          { key: 'updated' as const, label: 'Date Updated' }
                        ].map((option) => (
                          <button
                            key={option.key}
                            onClick={() => {
                              if (sortBy === option.key) {
                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                              } else {
                                setSortBy(option.key);
                                setSortOrder('desc');
                              }
                              setShowFilterPopup(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 text-sm rounded transition-colors ${
                              sortBy === option.key 
                                ? (isDark ? 'bg-gray-700' : 'bg-gray-100') 
                                : (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                            }`}
                          >
                            <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{option.label}</span>
                            {sortBy === option.key && (
                              sortOrder === 'desc' 
                                ? <SortDescIcon size={14} className={isDark ? 'fill-gray-200' : 'fill-gray-800'} />
                                : <SortAscIcon size={14} className={isDark ? 'fill-gray-200' : 'fill-gray-800'} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto px-3 pb-3 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}>
          {/* Loading State */}
          {(loading || isProjectSwitching) ? (
            <div className="space-y-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`p-3 border-l-2 border-l-transparent animate-pulse`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className="flex-1">
                      <div className={`h-4 rounded mb-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ width: `${60 + i * 20}%` }}></div>
                      <div className={`h-3 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <FileText className={`w-8 h-8 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              {searchQuery ? (
                <>
                  <p className="text-sm font-medium mb-1">No documents found</p>
                  <p className="text-xs">Try a different search term</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">No documents yet</p>
                  <p className="text-xs">Create your first document to get started</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className={`relative group transition-all duration-100 border-l-2 ${
                    selectedDoc?.id === doc.id
                      ? `${isDark ? 'bg-gray-800 border-l-gray-600' : 'bg-gray-100 border-l-gray-400'}`
                      : `hover:${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-l-transparent`
                  }`}
                >
                  <motion.button
                    onClick={() => {
                      setSelectedDoc(doc);
                    }}
                    className="w-full text-left p-3 pr-10"
                    whileHover={{ x: 8 }}
                    transition={{ duration: 0.08, ease: "easeOut" }}
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
                  
                  {/* Inline document delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDoc(doc); // Select document first to ensure it's set for deletion
                      handleDeleteDocument();
                    }}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                      isDark 
                        ? 'hover:bg-red-900/50 text-red-400 hover:text-red-300' 
                        : 'hover:bg-red-100 text-red-500 hover:text-red-600'
                    }`}
                    title="Delete Document"
                  >
                    <FiTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Document Counter */}
        <div className={`px-3 py-2 border-t text-center`} style={{ 
          borderColor: isDark ? '#2a2a2a' : '#e2e8f0',
          backgroundColor: isDark ? '#0f0f0f' : '#f8fafc'
        }}>
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            {filteredDocs.length} {filteredDocs.length === 1 ? 'document' : 'documents'}
            {searchQuery && ` (filtered from ${projectDocs.length})`}
          </span>
        </div>
      </div>

      {/* Document Editor */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {(loading || isProjectSwitching) ? (
          /* Loading State for Editor */
          <div className={`flex-1 flex items-center justify-center`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
            <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-sm">Loading documents...</p>
            </div>
          </div>
        ) : selectedDoc ? (
          <>
            {/* Document Header */}
            <div className={`px-6 py-4 border-b flex-shrink-0`} style={{ 
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
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div className={`flex-1 min-h-0`} style={{ backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }}>
              <div className="h-full p-4">
                <div className={`h-full border rounded-lg overflow-hidden`} style={{ 
                  backgroundColor: isDark ? '#111111' : '#ffffff',
                  borderColor: isDark ? '#2a2a2a' : '#e2e8f0'
                }}>
                  <EnhancedEditor
                    content={selectedDoc.content}
                    onChange={handleContentChange}
                    language={selectedDoc.language || 'markdown'}
                    onLanguageChange={handleLanguageChange}
                    placeholder="Start writing your document..."
                    fileName={selectedDoc.title}
                    onBlur={handleSaveDocument}
                  />
                </div>
              </div>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDeleteDocument}
        title="Delete Document"
        message="Are you sure you want to delete this document? All content will be permanently removed."
        itemName={selectedDoc?.title}
      />
    </div>
  );
};