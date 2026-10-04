/**
 * Image processing utilities for multimodal AI code generation.
 * Handles validation, canvas resizing, compression, and lightweight thumbnail creation.
 */

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGE_DIMENSION = 1568; // Gemini recommended max input dimension
const MAX_THUMBNAIL_DIMENSION = 200; // Lightweight thumbnail for chat persistence

/**
 * Validates and prepares an image file for the Gemini API.
 * Resizes the image to fit within max dimensions and generates base64 + thumbnail.
 */
export async function prepareImage(file) {
  if (!file) {
    throw new Error('No image file provided.');
  }

  // 1. Validate MIME type
  const mimeType = file.type?.toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error('Unsupported image format. Please attach a PNG, JPEG, or WebP image.');
  }

  // 2. Validate file size (max 10MB)
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Image size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB limit.`);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        if (!origWidth || !origHeight) {
          throw new Error('Unable to read image dimensions.');
        }

        // Calculate main resized dimensions (max 1568px longest edge)
        let targetWidth = origWidth;
        let targetHeight = origHeight;

        if (origWidth > MAX_IMAGE_DIMENSION || origHeight > MAX_IMAGE_DIMENSION) {
          if (origWidth >= origHeight) {
            targetWidth = MAX_IMAGE_DIMENSION;
            targetHeight = Math.round((origHeight * MAX_IMAGE_DIMENSION) / origWidth);
          } else {
            targetHeight = MAX_IMAGE_DIMENSION;
            targetWidth = Math.round((origWidth * MAX_IMAGE_DIMENSION) / origHeight);
          }
        }

        // Render main image onto Canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to create 2D canvas context.');
        }

        // Fill white background for transparency fallback if converting to JPEG
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const exportMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
        const exportQuality = 0.85;
        const fullDataUrl = canvas.toDataURL(exportMime, exportQuality);
        const base64 = fullDataUrl.split(',')[1] || '';

        // Generate tiny thumbnail (max 200px) for lightweight chat history storage
        let thumbWidth = origWidth;
        let thumbHeight = origHeight;
        if (origWidth > MAX_THUMBNAIL_DIMENSION || origHeight > MAX_THUMBNAIL_DIMENSION) {
          if (origWidth >= origHeight) {
            thumbWidth = MAX_THUMBNAIL_DIMENSION;
            thumbHeight = Math.round((origHeight * MAX_THUMBNAIL_DIMENSION) / origWidth);
          } else {
            thumbHeight = MAX_THUMBNAIL_DIMENSION;
            thumbWidth = Math.round((origWidth * MAX_THUMBNAIL_DIMENSION) / origHeight);
          }
        }

        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (thumbCtx) {
          thumbCtx.fillStyle = '#1e1b4b';
          thumbCtx.fillRect(0, 0, thumbWidth, thumbHeight);
          thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        }
        const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);

        resolve({
          id: 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          name: file.name || 'attachment.png',
          size: file.size,
          mimeType: exportMime,
          base64,
          thumbnail,
          previewUrl: fullDataUrl,
          width: targetWidth,
          height: targetHeight,
        });
      } catch (err) {
        reject(new Error(`Failed to process image: ${err.message}`));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Corrupted or unreadable image file.'));
    };

    img.src = objectUrl;
  });
}
