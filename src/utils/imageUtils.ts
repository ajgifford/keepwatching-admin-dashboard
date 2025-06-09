const STATIC_CONTENT_URL = import.meta.env.VITE_STATIC_CONTENT_URL || 'https://localhost:3001';

/**
 * Converts a relative image path to an absolute URL with the correct server prefix
 * @param imagePath - The image path from the API (e.g., /uploads/profiles/image.jpg)
 * @param defaultImage - Optional default image to use if imagePath is empty
 * @returns The complete URL to the image
 */
export function getImageUrl(imagePath: string | undefined, defaultImage?: string): string {
  // If path is a complete URL (starts with http/https), return as is
  if (imagePath?.startsWith('http://') || imagePath?.startsWith('https://')) {
    return imagePath;
  }

  if (!imagePath && defaultImage) {
    return defaultImage;
  }

  if (!imagePath) {
    return 'https://placehold.co/300x300/gray/white?text=No+Image';
  }

  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  return `${STATIC_CONTENT_URL}${normalizedPath}`;
}

/**
 * Converts a profile image path to an absolute URL
 * @param profileImage - The profile image path from the API
 * @returns The complete URL to the profile image
 */
export function getProfileImageUrl(profileImage: string | undefined): string {
  return getImageUrl(profileImage, 'https://placehold.co/300x300/gray/white?text=No+Profile');
}

/**
 * Converts an account image path to an absolute URL
 * @param profileImage - The account image path from the API
 * @returns The complete URL to the account image
 */
export function getAccountImageUrl(profileImage: string | undefined): string {
  return getImageUrl(profileImage, 'https://placehold.co/300x300/gray/white?text=No+Account');
}
