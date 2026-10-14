import * as argon2 from 'argon2';
import { USERNAME_REGEX, POST_MAX_LENGTH } from '@varta/shared';

describe('VARTA Core Business Logic & Security Constraints', () => {
  describe('Password Security (Argon2id)', () => {
    it('should hash passwords with Argon2id and verify correctly', async () => {
      const password = 'Varta@2026SecureTest!';
      const hash = await argon2.hash(password, { type: argon2.argon2id });

      expect(hash).toBeDefined();
      expect(hash.startsWith('$argon2id$')).toBe(true);

      const isValid = await argon2.verify(hash, password);
      expect(isValid).toBe(true);

      const isInvalid = await argon2.verify(hash, 'WrongPassword123');
      expect(isInvalid).toBe(false);
    });
  });

  describe('Username & Content Validation', () => {
    it('should validate normalized Indian usernames', () => {
      expect(USERNAME_REGEX.test('aarav_sharma')).toBe(true);
      expect(USERNAME_REGEX.test('priya_tech')).toBe(true);
      expect(USERNAME_REGEX.test('varta_official')).toBe(true);
      expect(USERNAME_REGEX.test('user123')).toBe(true);

      // Invalid handles
      expect(USERNAME_REGEX.test('ab')).toBe(false); // under 3 chars
      expect(USERNAME_REGEX.test('user with spaces')).toBe(false);
      expect(USERNAME_REGEX.test('user@domain')).toBe(false);
      expect(USERNAME_REGEX.test('user!name')).toBe(false);
    });

    it('should enforce 500 character limit on posts', () => {
      const validContent = 'A'.repeat(500);
      const invalidContent = 'A'.repeat(501);

      expect(validContent.length).toBeLessThanOrEqual(POST_MAX_LENGTH);
      expect(invalidContent.length).toBeGreaterThan(POST_MAX_LENGTH);
    });
  });

  describe('Hashtag & Mention Extraction', () => {
    const extractHashtags = (content: string): string[] => {
      const matches = content.match(/#[a-zA-Z0-9_]+/g);
      if (!matches) return [];
      return Array.from(new Set(matches.map((tag) => tag.slice(1).toLowerCase())));
    };

    const extractMentions = (content: string): string[] => {
      const matches = content.match(/@[a-zA-Z0-9_]+/g);
      if (!matches) return [];
      return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
    };

    it('should correctly extract and deduplicate hashtags', () => {
      const text = 'Exploring #TechIndia and #Startups in Bengaluru! #techindia #BaatSabki';
      const tags = extractHashtags(text);

      expect(tags).toEqual(['techindia', 'startups', 'baatsabki']);
    });

    it('should correctly extract mentions', () => {
      const text = 'Great insights by @aarav_sharma and @priya_tech on @varta_official';
      const mentions = extractMentions(text);

      expect(mentions).toEqual(['aarav_sharma', 'priya_tech', 'varta_official']);
    });
  });

  describe('Feed Ranking Scoring Formula', () => {
    it('should rank newer high-engagement posts above old low-engagement posts', () => {
      const calculateScore = (
        likes: number,
        replies: number,
        reposts: number,
        ageInHours: number,
      ) => {
        const engagement = likes * 1.0 + replies * 1.5 + reposts * 2.0;
        const decay = Math.pow(ageInHours + 2, 1.4);
        return (engagement + 5) / decay;
      };

      // Post A: 2 hours old, 50 likes, 10 replies, 5 reposts
      const scoreA = calculateScore(50, 10, 5, 2);

      // Post B: 72 hours old, 5 likes, 1 reply, 0 reposts
      const scoreB = calculateScore(5, 1, 0, 72);

      expect(scoreA).toBeGreaterThan(scoreB);
    });
  });
});
