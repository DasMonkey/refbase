/**
 * Supabase image upload service for bug report images
 * Handles secure upload to private storage bucket
 */

import { supabase } from '../lib/supabase';
import { processImage, generateImageFilename, ProcessedImage } from './imageProcessing';

export interface ImageUploadResult {
  id: string;
  url: string;
  path: string;
  originalName: string;
  fileSize: number;
  width: number;
  height: number;
  compressionRatio: number;
}

export interface ImageUploadProgress {
  stage: 'processing' | 'uploading' | 'saving-metadata' | 'complete';
  progress: number; // 0-100
  message: string;
}

export interface ImageUploadOptions {
  onProgress?: (progress: ImageUploadProgress) => void;
  signal?: AbortSignal; // For cancellation
}

/**
 * Upload processed image to Supabase storage
 */
export const uploadImageToBucket = async (
  blob: Blob,
  path: string,
  signal?: AbortSignal
): Promise<string> => {
  // Check if operation was cancelled
  if (signal?.aborted) {
    throw new Error('Upload cancelled');
  }

  console.log('📤 Uploading to bucket:', { path, blobType: blob.type, blobSize: blob.size });

  const { data, error } = await supabase.storage
    .from('bug-images')
    .upload(path, blob, {
      contentType: blob.type,
      upsert: false // Don't overwrite existing files
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('Upload succeeded but no data returned');
  }

  return data.path;
};

/**
 * Get public URL for permanent image access
 */
export const getPublicImageUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('bug-images')
    .getPublicUrl(path);

  return data.publicUrl;
};

/**
 * Delete image from storage bucket
 */
export const deleteImageFromBucket = async (paths: string[]): Promise<void> => {
  const { error } = await supabase.storage
    .from('bug-images')
    .remove(paths);

  if (error) {
    throw new Error(`Failed to delete images: ${error.message}`);
  }
};

/**
 * Save image metadata to database
 */
const saveImageMetadata = async (
  bugId: string,
  filename: string,
  originalName: string,
  fileSize: number,
  mimeType: string,
  imagePath: string,
  width: number,
  height: number
): Promise<string> => {
  // Get the current user for uploaded_by field
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('bug_images')
    .insert({
      bug_id: bugId,
      filename,
      original_name: originalName,
      file_size: fileSize,
      mime_type: mimeType,
      image_path: imagePath,
      width,
      height,
      uploaded_by: user.id
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save image metadata: ${error.message}`);
  }

  return data.id;
};

/**
 * Upload image file for a bug report
 */
export const uploadBugImage = async (
  file: File,
  projectId: string,
  bugId: string,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult> => {
  const { onProgress, signal } = options;

  try {
    // Debug: Check auth state before upload
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔐 Auth state during upload:', { 
      user: user?.id, 
      email: user?.email, 
      error: authError 
    });
    
    if (!user) {
      throw new Error('User not authenticated. Please log in and try again.');
    }

    // Stage 1: Process image
    onProgress?.({
      stage: 'processing',
      progress: 10,
      message: 'Processing image...'
    });

    const processed: ProcessedImage = await processImage(file);

    if (signal?.aborted) {
      throw new Error('Upload cancelled');
    }

    // Generate unique filename
    const filename = generateImageFilename(file.name, 'img');

    // Storage path: project-id/bug-id/filename
    const imagePath = `${projectId}/${bugId}/${filename}`;

    // Stage 2: Upload image
    onProgress?.({
      stage: 'uploading',
      progress: 50,
      message: 'Uploading image...'
    });

    await uploadImageToBucket(processed.fullSize.blob, imagePath, signal);

    if (signal?.aborted) {
      // Clean up uploaded file
      await deleteImageFromBucket([imagePath]).catch(() => {});
      throw new Error('Upload cancelled');
    }

    // Stage 3: Save metadata to database
    onProgress?.({
      stage: 'saving-metadata',
      progress: 80,
      message: 'Saving image information...'
    });

    const imageId = await saveImageMetadata(
      bugId,
      filename,
      file.name,
      file.size,
      file.type,
      imagePath,
      processed.fullSize.width,
      processed.fullSize.height
    );

    if (signal?.aborted) {
      // Clean up uploaded file and database entry
      await deleteImageFromBucket([imagePath]).catch(() => {});
      await supabase.from('bug_images').delete().eq('id', imageId).catch(() => {});
      throw new Error('Upload cancelled');
    }

    // Stage 4: Get public URL
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Upload complete!'
    });

    const imageUrl = getPublicImageUrl(imagePath);

    return {
      id: imageId,
      url: imageUrl,
      path: imagePath,
      originalName: file.name,
      fileSize: file.size,
      width: processed.fullSize.width,
      height: processed.fullSize.height,
      compressionRatio: processed.compressionRatio
    };

  } catch (error) {
    // Clean up on error
    onProgress?.({
      stage: 'processing',
      progress: 0,
      message: `Error: ${error instanceof Error ? error.message : 'Upload failed'}`
    });

    throw error;
  }
};

/**
 * Upload multiple images with progress tracking
 */
export const uploadMultipleBugImages = async (
  files: File[],
  projectId: string,
  bugId: string,
  options: Omit<ImageUploadOptions, 'onProgress'> & {
    onProgress?: (fileIndex: number, progress: ImageUploadProgress) => void;
    onFileComplete?: (fileIndex: number, result: ImageUploadResult) => void;
    onError?: (fileIndex: number, error: Error) => void;
  } = {}
): Promise<ImageUploadResult[]> => {
  const { onProgress, onFileComplete, onError, signal } = options;
  const results: ImageUploadResult[] = [];
  const errors: Error[] = [];

  for (let i = 0; i < files.length; i++) {
    if (signal?.aborted) {
      throw new Error('Upload cancelled');
    }

    try {
      const result = await uploadBugImage(files[i], projectId, bugId, {
        onProgress: (progress) => onProgress?.(i, progress),
        signal
      });

      results.push(result);
      onFileComplete?.(i, result);

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      errors.push(err);
      onError?.(i, err);
    }
  }

  // If some uploads failed, still return successful ones
  if (errors.length > 0 && results.length === 0) {
    throw new Error(`All uploads failed. Last error: ${errors[errors.length - 1].message}`);
  }

  return results;
};

/**
 * Get all images for a bug
 */
export const getBugImages = async (bugId: string): Promise<Array<{
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  url: string;
  createdAt: string;
}>> => {
  const { data, error } = await supabase
    .from('bug_images')
    .select('*')
    .eq('bug_id', bugId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch bug images: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Get public URLs for all images
  const imagesWithUrls = data.map((image) => {
    const imageUrl = getPublicImageUrl(image.image_path);

    return {
      id: image.id,
      filename: image.filename,
      originalName: image.original_name,
      fileSize: image.file_size,
      mimeType: image.mime_type,
      width: image.width,
      height: image.height,
      url: imageUrl,
      createdAt: image.created_at
    };
  });

  return imagesWithUrls;
};

/**
 * Delete bug image (from storage and database)
 */
export const deleteBugImage = async (imageId: string): Promise<void> => {
  // First get the image metadata to know which files to delete
  const { data: imageData, error: fetchError } = await supabase
    .from('bug_images')
    .select('image_path')
    .eq('id', imageId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch image data: ${fetchError.message}`);
  }

  if (!imageData) {
    throw new Error('Image not found');
  }

  // Delete from storage
  await deleteImageFromBucket([imageData.image_path]);

  // Delete from database
  const { error: deleteError } = await supabase
    .from('bug_images')
    .delete()
    .eq('id', imageId);

  if (deleteError) {
    throw new Error(`Failed to delete image metadata: ${deleteError.message}`);
  }
};

/**
 * Delete image by URL (for cleanup when image is removed from editor)
 */
export const deleteBugImageByUrl = async (imageUrl: string): Promise<void> => {
  try {
    // Extract path from URL - handle public bucket URLs
    const urlParts = imageUrl.split('/storage/v1/object/public/bug-images/');
    if (urlParts.length < 2) {
      console.warn('Invalid image URL format:', imageUrl);
      return;
    }
    
    const imagePath = urlParts[1];
    
    // Find the image in database by path
    const { data: images, error: fetchError } = await supabase
      .from('bug_images')
      .select('id, image_path')
      .eq('image_path', imagePath);

    if (fetchError) {
      throw new Error(`Failed to find image: ${fetchError.message}`);
    }

    if (!images || images.length === 0) {
      console.warn('Image not found in database for URL:', imageUrl);
      return;
    }

    // Delete the found image(s)
    for (const image of images) {
      await deleteBugImage(image.id);
      console.log('Successfully deleted image:', image.id);
    }
  } catch (error) {
    console.error('Failed to delete image by URL:', imageUrl, error);
    throw error;
  }
};

/**
 * Clean up images when a bug is deleted
 * This should be called when a bug is deleted to remove associated images
 */
export const cleanupBugImages = async (bugId: string): Promise<void> => {
  const images = await getBugImages(bugId);
  
  if (images.length === 0) {
    return;
  }

  // Delete all files from storage
  const paths = images.flatMap(img => [img.thumbnailUrl, img.fullSizeUrl]);
  await deleteImageFromBucket(paths);

  // Database records will be automatically deleted due to CASCADE constraint
};

/**
 * Get storage usage statistics
 */
export const getStorageStats = async (projectId: string): Promise<{
  totalImages: number;
  totalSize: number;
  formattedSize: string;
}> => {
  const { data, error } = await supabase
    .from('bug_images')
    .select('file_size')
    .eq('bug_id', projectId); // This will need to be adjusted based on your schema

  if (error) {
    throw new Error(`Failed to fetch storage stats: ${error.message}`);
  }

  const totalImages = data?.length || 0;
  const totalSize = data?.reduce((sum, img) => sum + img.file_size, 0) || 0;
  
  // Format size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    totalImages,
    totalSize,
    formattedSize: formatBytes(totalSize)
  };
};