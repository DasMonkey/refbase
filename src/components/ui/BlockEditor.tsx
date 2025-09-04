/**
 * Notion-like block editor using BlockNote
 * Supports text, images, and other content blocks
 */

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { PartialBlock } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useTheme } from '../../contexts/ThemeContext';
import { useImageUpload } from '../../hooks/useImageUpload';
import { ImageModal } from './ImageModal';

interface BlockEditorProps {
  content: PartialBlock[];
  onChange: (blocks: PartialBlock[]) => void;
  placeholder?: string;
  onSave?: (blocks: PartialBlock[]) => void;
  forceSaveRef?: React.MutableRefObject<(() => void) | null>;
  // Image upload support
  enableImageUpload?: boolean;
  projectId?: string;
  bugId?: string;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  content,
  onChange,
  placeholder = "Type '/' for commands or start writing...",
  onSave,
  forceSaveRef,
  enableImageUpload = false,
  projectId,
  bugId
}) => {
  const { isDark } = useTheme();
  const imageUpload = useImageUpload();
  
  // Auto-save with debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Image modal state
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: '',
    altText: '',
    originalName: ''
  });
  

  // Custom image upload handler
  const uploadFile = useCallback(async (file: File) => {
    if (!enableImageUpload || !projectId || !bugId) {
      throw new Error('Image upload not configured');
    }

    try {
      const result = await imageUpload.uploadImage(file, projectId, bugId);
      if (!result) {
        throw new Error('Upload failed');
      }

      // Return the image URL for display in the editor
      return result.url;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }, [enableImageUpload, projectId, bugId, imageUpload]);

  // Track previous content to detect deleted images
  const previousContentRef = useRef<PartialBlock[]>(content);

  // Clean up deleted images from storage
  const cleanupDeletedImages = useCallback(async (
    oldBlocks: PartialBlock[], 
    newBlocks: PartialBlock[], 
    bugId: string
  ) => {
    try {
      // Extract image URLs from old and new content
      const oldImageUrls = new Set<string>();
      const newImageUrls = new Set<string>();
      
      const extractImageUrls = (blocks: PartialBlock[], urlSet: Set<string>) => {
        blocks.forEach(block => {
          if (block.type === 'image' && block.props?.url) {
            urlSet.add(block.props.url as string);
          }
        });
      };
      
      extractImageUrls(oldBlocks, oldImageUrls);
      extractImageUrls(newBlocks, newImageUrls);
      
      // Find deleted images (in old but not in new)
      const deletedUrls = Array.from(oldImageUrls).filter(url => !newImageUrls.has(url));
      
      if (deletedUrls.length > 0) {
        console.log('Cleaning up deleted images:', deletedUrls);
        
        // Delete images from storage and database
        for (const url of deletedUrls) {
          try {
            const { deleteBugImageByUrl } = await import('../../services/imageUpload');
            await deleteBugImageByUrl(url);
          } catch (error) {
            console.error('Failed to delete image:', url, error);
          }
        }
      }
    } catch (error) {
      console.error('Error in image cleanup:', error);
    }
  }, []);

  // Debounced auto-save function with image cleanup
  const handleContentChange = useCallback((newBlocks: PartialBlock[]) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save for 800ms
    saveTimeoutRef.current = setTimeout(async () => {
      onChange(newBlocks);
      
      // Clean up deleted images if image upload is enabled
      if (enableImageUpload && bugId) {
        await cleanupDeletedImages(previousContentRef.current, newBlocks, bugId);
      }
      
      // Update previous content reference for next comparison
      previousContentRef.current = newBlocks;
      
      // Trigger onSave to save to database with current blocks
      if (onSave) {
        onSave(newBlocks);
      }
    }, 800);
  }, [onChange, onSave, enableImageUpload, bugId, cleanupDeletedImages]);

  // Create BlockNote editor with custom configuration
  const editor = useCreateBlockNote({
    initialContent: content,
    uploadFile: enableImageUpload ? uploadFile : undefined,
  });

  // Force save function
  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    if (editor && onSave) {
      const currentBlocks = editor.document;
      onChange(currentBlocks);
      onSave(currentBlocks);
    }
  }, [editor, onChange, onSave]);

  // Expose force save function to parent
  useEffect(() => {
    if (forceSaveRef) {
      forceSaveRef.current = forceSave;
    }
  }, [forceSaveRef, forceSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Don't force save on unmount to avoid infinite loops
        // The debounced auto-save will handle saving
      }
    };
  }, []);

  // Handle image clicks for modal view
  const handleImageClick = useCallback((imageUrl: string, altText: string) => {
    // Extract original filename from alt text or URL
    const originalName = altText || imageUrl.split('/').pop() || 'image.jpg';
    
    setImageModal({
      isOpen: true,
      imageUrl,
      altText,
      originalName
    });
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModal({
      isOpen: false,
      imageUrl: '',
      altText: '',
      originalName: ''
    });
  }, []);

  // Custom styles for dark/light theme
  const editorStyles = useMemo(() => ({
    ...(isDark ? {
      '.bn-editor': {
        backgroundColor: '#111111',
        color: '#e5e5e5',
      },
      '.bn-editor .ProseMirror': {
        backgroundColor: '#111111',
        color: '#e5e5e5',
      },
      '.bn-editor .bn-block-content': {
        color: '#e5e5e5',
      },
      '.bn-editor .bn-placeholder': {
        color: '#6b7280',
      },
    } : {
      '.bn-editor': {
        backgroundColor: '#ffffff',
        color: '#111111',
      },
      '.bn-editor .ProseMirror': {
        backgroundColor: '#ffffff',
        color: '#111111',
      },
      '.bn-editor .bn-block-content': {
        color: '#111111',
      },
      '.bn-editor .bn-placeholder': {
        color: '#9ca3af',
      },
    }),
  }), [isDark]);

  return (
    <div 
      className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-white'}`}
    >

      {/* Upload progress indicator */}
      {imageUpload.state.uploading && enableImageUpload && (
        <div className={`p-3 border-b ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {imageUpload.state.stage}
              </div>
              <div className={`w-full h-1.5 rounded-full mt-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${imageUpload.state.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {imageUpload.state.error && enableImageUpload && (
        <div className={`p-3 border-b ${
          isDark ? 'bg-red-900/50 border-red-700' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                Upload Failed
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {imageUpload.state.error}
              </p>
            </div>
            <button
              onClick={imageUpload.clearError}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                isDark ? 'bg-red-800 text-red-200 hover:bg-red-700' : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* BlockNote Editor */}
      <div className={`flex-1 min-h-0 ${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`}
           style={{ height: '100%' }}>
        <style>{`
          ${Object.entries(editorStyles).map(([selector, styles]) => 
            `${selector} { ${Object.entries(styles as Record<string, string>).map(([prop, value]) => 
              `${prop}: ${value};`
            ).join(' ')} }`
          ).join('\n')}
          
          
          /* Image styling */
          .bn-editor img {
            cursor: pointer;
            transition: opacity 0.2s;
            border-radius: 6px;
            border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
          }
          
          .bn-editor img:hover {
            opacity: 0.8;
          }
          
          /* Placeholder styling */
          .bn-editor .bn-placeholder {
            font-style: italic;
          }
          
          /* Force BlockNote to fill container height with proper scrolling */
          .bn-container {
            height: 100% !important;
            min-height: 400px !important;
            overflow: auto !important;
            background-color: ${isDark ? '#111111' : '#ffffff'} !important;
          }
          
          .bn-editor {
            height: 100% !important;
            min-height: 400px !important;
            overflow: auto !important;
            background-color: ${isDark ? '#111111' : '#ffffff'} !important;
          }
          
          .bn-editor .ProseMirror {
            min-height: calc(100vh - 200px) !important;
            height: auto !important;
            padding: 2rem 1rem 2rem 1rem !important;
            overflow-y: auto !important;
            background-color: ${isDark ? '#111111' : '#ffffff'} !important;
          }
          
          /* Override BlockNote's default backgrounds */
          [data-color-scheme="dark"] .bn-container,
          [data-color-scheme="dark"] .bn-editor,
          [data-color-scheme="dark"] .ProseMirror {
            background-color: #111111 !important;
          }
          
          /* Apply consistent scrollbar styling to BlockNote elements */
          .bn-container,
          .bn-editor,
          .bn-editor .ProseMirror {
            scrollbar-width: thin;
            scrollbar-color: ${isDark ? '#374151 #1f2937' : '#cbd5e1 #f1f5f9'};
          }
          
          /* Force top padding with more specific selectors */
          .bn-container .bn-editor {
            padding-top: 2rem !important;
          }
          
          /* Even more specific - target the content area directly */
          div[data-color-scheme] .bn-editor {
            padding-top: 2rem !important;
          }
          
          /* Universal approach - add padding to any BlockNote editor */
          [class*="bn-editor"] {
            padding-top: 2rem !important;
          }
        `}</style>
        
        <div className={`${isDark ? 'dark-scrollbar' : 'light-scrollbar'}`} style={{ height: '100%', minHeight: '400px' }}>
          <BlockNoteView
            editor={editor}
            onChange={() => {
              // Use debounced auto-save instead of immediate onChange
              handleContentChange(editor.document);
            }}
            theme={isDark ? 'dark' : 'light'}
          />
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        imageUrl={imageModal.imageUrl}
        altText={imageModal.altText}
        originalName={imageModal.originalName}
      />
    </div>
  );
};