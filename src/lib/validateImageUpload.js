const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export function validateImageUpload(file) {
  if (!file) return 'No file selected';

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported image type. Use JPEG, PNG, or WebP.';
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return 'Photo too large. Maximum: 20MB';
  }

  return null;
}
