import { z } from 'zod';
import {
  USERNAME_REGEX,
  PASSWORD_MIN_LENGTH,
  POST_MAX_LENGTH,
  POLL_MIN_OPTIONS,
  POLL_MAX_OPTIONS,
  POLL_OPTION_MAX_LENGTH,
  POLL_QUESTION_MAX_LENGTH,
  BIO_MAX_LENGTH,
  DISPLAY_NAME_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  WEBSITE_MAX_LENGTH,
} from './constants';
import { ReportCategory } from './enums';

export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(
      USERNAME_REGEX,
      'Username can only contain letters, numbers, and underscores',
    )
    .transform((val) => val.toLowerCase()),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(128, 'Password must not exceed 128 characters'),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(DISPLAY_NAME_MAX_LENGTH, `Display name must not exceed ${DISPLAY_NAME_MAX_LENGTH} characters`),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  identifier: z.string().min(1, 'Please enter your username or email'),
  password: z.string().min(1, 'Please enter your password'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(DISPLAY_NAME_MAX_LENGTH).optional(),
  bio: z.string().max(BIO_MAX_LENGTH).optional().nullable(),
  location: z.string().max(LOCATION_MAX_LENGTH).optional().nullable(),
  website: z.string().url('Please enter a valid URL').max(WEBSITE_MAX_LENGTH).optional().nullable(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export const CreatePollSchema = z.object({
  question: z.string().min(1).max(POLL_QUESTION_MAX_LENGTH),
  options: z
    .array(z.string().min(1).max(POLL_OPTION_MAX_LENGTH))
    .min(POLL_MIN_OPTIONS, `Poll must have at least ${POLL_MIN_OPTIONS} options`)
    .max(POLL_MAX_OPTIONS, `Poll cannot have more than ${POLL_MAX_OPTIONS} options`),
  durationHours: z.number().int().min(1).max(168).default(24),
});

export type CreatePollDto = z.infer<typeof CreatePollSchema>;

export const CreatePostSchema = z.object({
  content: z.string().max(POST_MAX_LENGTH, `Post cannot exceed ${POST_MAX_LENGTH} characters`),
  parentId: z.string().uuid().optional().nullable(),
  repostOfId: z.string().uuid().optional().nullable(),
  quotePostId: z.string().uuid().optional().nullable(),
  mediaUrls: z
    .array(
      z.object({
        url: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        type: z.enum(['IMAGE', 'VIDEO', 'GIF']),
        mimeType: z.string(),
        sizeBytes: z.number().int(),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
      }),
    )
    .max(4)
    .optional(),
  poll: CreatePollSchema.optional(),
}).refine(
  (data) =>
    data.content.trim().length > 0 ||
    (data.mediaUrls && data.mediaUrls.length > 0) ||
    data.poll ||
    data.repostOfId,
  {
    message: 'Post must contain text content, media, a poll, or be a repost.',
    path: ['content'],
  },
);

export type CreatePostDto = z.infer<typeof CreatePostSchema>;

export const CreateReportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  category: z.nativeEnum(ReportCategory),
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(1000),
}).refine((data) => data.reportedUserId || data.postId, {
  message: 'Must report either a user or a post',
  path: ['postId'],
});

export type CreateReportDto = z.infer<typeof CreateReportSchema>;

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
  mediaUrl: z.string().url().optional(),
});

export type SendMessageDto = z.infer<typeof SendMessageSchema>;
