/**
 * Image Upload Utilities for Congratulations Feature
 *
 * Current implementation: Base64 encoding for simplicity
 * For production with many users, consider:
 * - Cloudinary (cloudinary.com)
 * - AWS S3 + CloudFront
 * - Vercel Blob Storage
 */

/**
 * Convert File to Base64 string
 * @param file - File object from input[type="file"]
 * @returns Promise<string> - Base64 encoded string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file
 * @param file - File to validate
 * @returns { valid: boolean, error?: string }
 */
export const validateImage = (file: File): { valid: boolean; error?: string } => {
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image size must be less than 5MB'
    };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, WebP, and GIF images are allowed'
    };
  }

  return { valid: true };
};

/**
 * Compress and resize image before upload
 * @param file - Original image file
 * @param maxWidth - Maximum width (default: 800px)
 * @param maxHeight - Maximum height (default: 800px)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Promise<string> - Base64 encoded compressed image
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const compressedBase64 = canvas.toDataURL(file.type, quality);
        resolve(compressedBase64);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Process image upload with validation and compression
 * @param file - Image file to process
 * @returns Promise<{ success: boolean, data?: string, error?: string }>
 */
export const processImageUpload = async (
  file: File
): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    // Validate image
    const validation = validateImage(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Compress and encode
    const base64Image = await compressImage(file);

    return {
      success: true,
      data: base64Image
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      success: false,
      error: 'Failed to process image'
    };
  }
};
