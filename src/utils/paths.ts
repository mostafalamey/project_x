/**
 * Utility functions for handling file paths with BASE_URL support
 */

/**
 * Converts a data path to a full URL with BASE_URL prefix
 * @param path - Path starting with /data/ or relative path
 * @returns Full URL with BASE_URL prefix
 */
export const getDataUrl = (path: string | undefined | null): string => {
  if (!path) return "";

  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Prepend base URL from Vite config
  return `${import.meta.env.BASE_URL}${cleanPath}`;
};

/**
 * Converts multiple paths to full URLs
 * @param paths - Array of paths
 * @returns Array of full URLs
 */
export const getDataUrls = (paths: string[]): string[] => {
  return paths.map(getDataUrl);
};
