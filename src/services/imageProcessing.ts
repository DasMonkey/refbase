/**
 * Image processing utilities for bug report images
 * Handles compression, resizing, and format conversion
 */

export interface ProcessedImage {
  fullSize: {
    blob: Blob;
    dataUrl: string;
    width: number;
    height: number;
  };
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface ImageProcessingOptions {
  fullSizeMaxWidth: number;
  fullSizeQuality: number;
  outputFormat: 'webp' | 'jpeg';
}

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  fullSizeMaxWidth: 1200,  // Optimal size for screenshots
  fullSizeQuality: 1.0,  // Maximum quality - crystal clear
  outputFormat: 'webp'  // WebP is much more efficient than JPEG/PNG
};

/**
 * Check if WebP is supported in the current browser
 */
export const isWebPSupported = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
};

/**
 * Validate image file before processing
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: JPEG, PNG, WebP, GIF. Got: ${file.type}`
    };
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: 10MB. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  // Check file name
  if (!file.name || file.name.length > 255) {
    return {
      valid: false,
      error: 'Invalid file name'
    };
  }

  return { valid: true };
};

/**
 * Load image from file and return HTMLImageElement
 */
const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Load image from blob and return HTMLImageElement
 */
const loadImageFromBlob = (blob: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image from blob'));
    };
    
    img.src = url;
  });
};

/**
 * Resize image while maintaining aspect ratio
 */
const resizeImage = (
  img: HTMLImageElement,
  maxWidth: number,
  quality: number,
  format: 'webp' | 'jpeg'
): { blob: Blob; dataUrl: string; width: number; height: number } => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Calculate new dimensions maintaining aspect ratio
  let { width, height } = img;
  
  // Only resize if the image is actually larger than maxWidth
  // Don't upscale small images
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;

  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw resized image
  ctx.drawImage(img, 0, 0, width, height);

  // Get data URL with adaptive quality
  // Use higher quality for smaller images to maintain readability
  const adaptiveQuality = width < 600 ? Math.min(quality + 0.1, 0.95) : quality;
  const outputFormat = format === 'webp' && isWebPSupported() ? 'image/webp' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(outputFormat, adaptiveQuality);

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create blob from canvas');
      }
      resolve({
        blob,
        dataUrl,
        width,
        height
      });
    }, outputFormat, adaptiveQuality);
  });
};

/**
 * Process image file to create thumbnail and full-size versions
 */
export const processImage = async (
  file: File,
  options: Partial<ImageProcessingOptions> = {}
): Promise<ProcessedImage> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate file first
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Load original image
    const img = await loadImageFromFile(file);
    
    // Create only full-size version (no thumbnail needed)
    let fullSize;
    if (img.width > opts.fullSizeMaxWidth) {
      fullSize = await resizeImage(
        img,
        opts.fullSizeMaxWidth,
        opts.fullSizeQuality,
        opts.outputFormat
      );
    } else {
      // If image is already smaller than max, just compress it
      fullSize = await resizeImage(
        img,
        img.width,
        opts.fullSizeQuality,
        opts.outputFormat
      );
    }

    const compressedSize = fullSize.blob.size;
    const compressionRatio = ((file.size - compressedSize) / file.size) * 100;

    return {
      fullSize,
      originalSize: file.size,
      compressedSize,
      compressionRatio
    };

  } catch (error) {
    throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Process image from clipboard paste event
 */
export const processClipboardImage = async (
  clipboardData: DataTransfer,
  options: Partial<ImageProcessingOptions> = {}
): Promise<ProcessedImage | null> => {
  // Look for image files in clipboard
  const files = Array.from(clipboardData.files);
  const imageFile = files.find(file => file.type.startsWith('image/'));
  
  if (imageFile) {
    return await processImage(imageFile, options);
  }

  // Look for image data in clipboard items
  const items = Array.from(clipboardData.items);
  const imageItem = items.find(item => item.type.startsWith('image/'));
  
  if (imageItem) {
    const file = imageItem.getAsFile();
    if (file) {
      return await processImage(file, options);
    }
  }

  return null;
};

/**
 * Generate unique filename for storage
 */
export const generateImageFilename = (originalName: string, suffix: 'thumb' | 'full'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = isWebPSupported() ? 'webp' : 'jpg';
  
  // Remove original extension and add our own
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const safeName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  
  return `${timestamp}-${random}-${safeName}-${suffix}.${extension}`;
};

/**
 * Get image dimensions without loading the full image
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to get image dimensions'));
    };
    
    img.src = url;
  });
};

/**
 * Convert bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if file is a valid image by examining its header
 */
export const isValidImageFile = async (file: File): Promise<boolean> => {
  if (!file.type.startsWith('image/')) {
    return false;
  }

  // Check file headers (magic numbers)
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // JPEG: FF D8 FF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return true;
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return true;
  }

  // GIF: 47 49 46 38
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return true;
  }

  return false;
};