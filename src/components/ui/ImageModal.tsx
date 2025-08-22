/**
 * Modal component for viewing expanded images
 * Supports keyboard navigation and click-to-close
 */

import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
  originalName?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  altText = 'Image',
  originalName
}) => {
  const { isDark } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Reset zoom and rotation when image changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setIsLoading(true);
    }
  }, [isOpen, imageUrl]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName || 'image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${
        isDark ? 'bg-black/90' : 'bg-black/75'
      }`}
      onClick={handleBackdropClick}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent`} />
        </div>
      )}

      {/* Toolbar */}
      <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 px-4 py-2 rounded-lg ${
        isDark ? 'bg-gray-900/90 border-gray-700' : 'bg-white/90 border-gray-300'
      } border backdrop-blur-sm z-10`}>
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.1}
          className={`p-2 rounded transition-colors ${
            zoom <= 0.1 
              ? (isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
              : (isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
          }`}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        
        <span className={`text-sm font-mono px-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {Math.round(zoom * 100)}%
        </span>
        
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 5}
          className={`p-2 rounded transition-colors ${
            zoom >= 5 
              ? (isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
              : (isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
          }`}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        
        <div className={`w-px h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
        
        <button
          onClick={handleResetZoom}
          className={`p-2 rounded transition-colors ${
            isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="Reset Zoom & Rotation"
        >
          <RotateCcw size={16} />
        </button>
        
        <button
          onClick={handleDownload}
          className={`p-2 rounded transition-colors ${
            isDark ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="Download Image"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className={`absolute top-4 right-4 p-2 rounded-full ${
          isDark ? 'bg-gray-900/90 text-gray-300 hover:text-white hover:bg-gray-800' : 'bg-white/90 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        } border ${isDark ? 'border-gray-700' : 'border-gray-300'} backdrop-blur-sm transition-colors z-10`}
        title="Close (ESC)"
      >
        <X size={20} />
      </button>

      {/* Image */}
      <div className="max-w-[90vw] max-h-[90vh] overflow-auto">
        <img
          src={imageUrl}
          alt={altText}
          onLoad={handleImageLoad}
          className="max-w-none cursor-move select-none"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease-out',
            transformOrigin: 'center center'
          }}
          draggable={false}
        />
      </div>

      {/* Image info */}
      {originalName && (
        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg ${
          isDark ? 'bg-gray-900/90 text-gray-300 border-gray-700' : 'bg-white/90 text-gray-600 border-gray-300'
        } border backdrop-blur-sm`}>
          <span className="text-sm font-medium">{originalName}</span>
        </div>
      )}

      {/* Instructions */}
      <div className={`absolute bottom-4 right-4 px-3 py-2 rounded-lg text-xs ${
        isDark ? 'bg-gray-900/90 text-gray-400 border-gray-700' : 'bg-white/90 text-gray-500 border-gray-300'
      } border backdrop-blur-sm`}>
        <div>Click outside or press ESC to close</div>
        <div>Scroll to zoom • Click and drag to pan</div>
      </div>
    </div>
  );
};