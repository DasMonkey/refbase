/**
 * Custom hook for managing image uploads in bug reports
 * Provides upload state management and error handling
 */

import { useState, useCallback, useRef } from 'react';
import { uploadBugImage, uploadMultipleBugImages, deleteBugImage, getBugImages, ImageUploadResult, ImageUploadProgress } from '../services/imageUpload';
import { validateImageFile } from '../services/imageProcessing';

export interface UseImageUploadState {
  uploading: boolean;
  progress: number;
  stage: string;
  error: string | null;
  uploadedImages: ImageUploadResult[];
}

export interface UseImageUploadReturn {
  state: UseImageUploadState;
  uploadImage: (file: File, projectId: string, bugId: string) => Promise<ImageUploadResult | null>;
  uploadMultipleImages: (files: File[], projectId: string, bugId: string) => Promise<ImageUploadResult[]>;
  deleteImage: (imageId: string) => Promise<void>;
  loadImages: (bugId: string) => Promise<void>;
  clearError: () => void;
  cancelUpload: () => void;
  reset: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [state, setState] = useState<UseImageUploadState>({
    uploading: false,
    progress: 0,
    stage: '',
    error: null,
    uploadedImages: []
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const setUploading = useCallback((uploading: boolean) => {
    setState(prev => ({ ...prev, uploading }));
  }, []);

  const setProgress = useCallback((progress: number, stage: string) => {
    setState(prev => ({ ...prev, progress, stage }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const addUploadedImage = useCallback((image: ImageUploadResult) => {
    setState(prev => ({
      ...prev,
      uploadedImages: [...prev.uploadedImages, image]
    }));
  }, []);

  const removeUploadedImage = useCallback((imageId: string) => {
    setState(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter(img => img.id !== imageId)
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      stage: '',
      error: null,
      uploadedImages: []
    });
  }, []);

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setUploading(false);
    setProgress(0, '');
    setError('Upload cancelled');
  }, [setUploading, setProgress, setError]);

  const uploadImage = useCallback(async (
    file: File,
    projectId: string,
    bugId: string
  ): Promise<ImageUploadResult | null> => {
    clearError();
    
    // Validate file first
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return null;
    }

    setUploading(true);
    setProgress(0, 'Starting upload...');

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const result = await uploadBugImage(file, projectId, bugId, {
        onProgress: (progress: ImageUploadProgress) => {
          setProgress(progress.progress, progress.message);
        },
        signal: abortControllerRef.current.signal
      });

      addUploadedImage(result);
      setProgress(100, 'Upload complete!');
      
      // Clear progress after a short delay
      setTimeout(() => {
        setUploading(false);
        setProgress(0, '');
      }, 1000);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      setUploading(false);
      setProgress(0, '');
      return null;
    } finally {
      abortControllerRef.current = null;
    }
  }, [clearError, setUploading, setProgress, setError, addUploadedImage]);

  const uploadMultipleImages = useCallback(async (
    files: File[],
    projectId: string,
    bugId: string
  ): Promise<ImageUploadResult[]> => {
    clearError();
    
    if (files.length === 0) {
      return [];
    }

    // Validate all files first
    const validationErrors: string[] = [];
    files.forEach((file, index) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        validationErrors.push(`File ${index + 1}: ${validation.error}`);
      }
    });

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return [];
    }

    setUploading(true);
    setProgress(0, `Uploading ${files.length} images...`);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const results: ImageUploadResult[] = [];
      let completedFiles = 0;

      const uploadResults = await uploadMultipleBugImages(files, projectId, bugId, {
        onProgress: (fileIndex: number, progress: ImageUploadProgress) => {
          const overallProgress = ((completedFiles * 100) + progress.progress) / files.length;
          setProgress(
            overallProgress, 
            `File ${fileIndex + 1}/${files.length}: ${progress.message}`
          );
        },
        onFileComplete: (fileIndex: number, result: ImageUploadResult) => {
          results.push(result);
          addUploadedImage(result);
          completedFiles++;
        },
        onError: (fileIndex: number, error: Error) => {
          console.error(`Failed to upload file ${fileIndex + 1}:`, error);
          // Continue with other files
        },
        signal: abortControllerRef.current.signal
      });

      setProgress(100, `Uploaded ${results.length}/${files.length} images`);
      
      // Clear progress after a short delay
      setTimeout(() => {
        setUploading(false);
        setProgress(0, '');
      }, 2000);

      if (results.length < files.length) {
        setError(`Only ${results.length} out of ${files.length} images uploaded successfully`);
      }

      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      setUploading(false);
      setProgress(0, '');
      return [];
    } finally {
      abortControllerRef.current = null;
    }
  }, [clearError, setUploading, setProgress, setError, addUploadedImage]);

  const deleteImage = useCallback(async (imageId: string): Promise<void> => {
    try {
      await deleteBugImage(imageId);
      removeUploadedImage(imageId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      setError(errorMessage);
      throw error;
    }
  }, [removeUploadedImage, setError]);

  const loadImages = useCallback(async (bugId: string): Promise<void> => {
    try {
      const images = await getBugImages(bugId);
      setState(prev => ({
        ...prev,
        uploadedImages: images.map(img => ({
          id: img.id,
          thumbnailUrl: img.thumbnailUrl,
          fullSizeUrl: img.fullSizeUrl,
          thumbnailPath: '', // Not needed for display
          fullSizePath: '', // Not needed for display
          originalName: img.originalName,
          fileSize: img.fileSize,
          width: img.width,
          height: img.height,
          compressionRatio: 0 // Not stored in DB
        }))
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load images';
      setError(errorMessage);
    }
  }, [setError]);

  return {
    state,
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    loadImages,
    clearError,
    cancelUpload,
    reset
  };
};

// Hook for drag and drop functionality
export const useDragAndDrop = (
  onFileDrop: (files: File[]) => void,
  accept: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setDragCounter(0);

    if (e.dataTransfer?.files) {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => accept.includes(file.type));
      
      if (imageFiles.length > 0) {
        onFileDrop(imageFiles);
      }
    }
  }, [onFileDrop, accept]);

  const setupDragAndDrop = useCallback((element: HTMLElement | null) => {
    if (!element) return;

    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);

    return () => {
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return {
    isDragging,
    setupDragAndDrop
  };
};