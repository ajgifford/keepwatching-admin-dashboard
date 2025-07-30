// Date formatting
export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString();
};

// File size formatting
export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

export function buildTMDBImagePath(
  path: string | undefined,
  size: string = 'w185',
  alt: string = 'No Image',
): string | undefined {
  if (path) {
    return `${IMAGE_BASE_URL}${size}${path}`;
  }
  return buildDefaultImagePath(alt);
}

export function buildDefaultImagePath(altImageName: string): string {
  const formattedAltImageName = replaceSpacesWithPlus(altImageName);
  return `https://placehold.co/300x200/gray/white?text=${formattedAltImageName}&font=roboto`;
}

function replaceSpacesWithPlus(input: string): string {
  return input.replace(/ /g, '+');
}

export const formatGender = (gender: number) => {
  switch (gender) {
    case 1:
      return 'Female';
    case 2:
      return 'Male';
    case 3:
      return 'Non-binary';
    default:
      return 'Unknown';
  }
};

export const getGenderColor = (gender: number) => {
  switch (gender) {
    case 1:
      return 'secondary';
    case 2:
      return 'primary';
    case 3:
      return 'info';
    default:
      return 'default';
  }
};
