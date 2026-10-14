export const APP_NAME = 'VARTA';
export const APP_TAGLINE = 'Baat Sabki';

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const POST_MAX_LENGTH = 500;
export const BIO_MAX_LENGTH = 300;
export const DISPLAY_NAME_MAX_LENGTH = 50;
export const LOCATION_MAX_LENGTH = 100;
export const WEBSITE_MAX_LENGTH = 200;

export const MAX_MEDIA_PER_POST = 4;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 50;

export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 4;
export const POLL_OPTION_MAX_LENGTH = 100;
export const POLL_QUESTION_MAX_LENGTH = 200;
export const POLL_MIN_DURATION_HOURS = 1;
export const POLL_MAX_DURATION_DAYS = 7;
