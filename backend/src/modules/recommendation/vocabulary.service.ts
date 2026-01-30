import { prisma } from '../../shared/database/client.js';
import { redisClient } from '../../shared/database/redis.js';
import { HASHTAG_VOCAB_SIZE, SKILL_VOCAB_SIZE, VOCAB_CACHE_TTL } from './recommendation.types.js';

const HASHTAG_VOCAB_KEY = 'rec:vocab:hashtags';
const SKILL_VOCAB_KEY = 'rec:vocab:skills';

export class VocabularyService {
  private static hashtagVocab: Map<string, number> | null = null;
  private static skillVocab: Map<string, number> | null = null;

  // Build top-N hashtag vocabulary from posts
  static async buildHashtagVocab(): Promise<Map<string, number>> {
    // Try cache first
    try {
      const cached = await redisClient.get(HASHTAG_VOCAB_KEY);
      if (cached) {
        const entries: [string, number][] = JSON.parse(cached);
        VocabularyService.hashtagVocab = new Map(entries);
        return VocabularyService.hashtagVocab;
      }
    } catch {
      // Cache miss or error, rebuild
    }

    // Get hashtag frequency counts from posts
    const posts = await prisma.post.findMany({
      select: { hashtags: true },
    });

    const freq = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.hashtags) {
        const normalized = tag.toLowerCase();
        freq.set(normalized, (freq.get(normalized) || 0) + 1);
      }
    }

    // Sort by frequency and take top N
    const sorted = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, HASHTAG_VOCAB_SIZE);

    const vocab = new Map<string, number>();
    sorted.forEach(([tag], index) => {
      vocab.set(tag, index);
    });

    // Cache for 24h
    try {
      await redisClient.setEx(
        HASHTAG_VOCAB_KEY,
        VOCAB_CACHE_TTL,
        JSON.stringify([...vocab.entries()])
      );
    } catch {
      // Non-fatal
    }

    VocabularyService.hashtagVocab = vocab;
    return vocab;
  }

  // Build top-N skill vocabulary from user profiles
  static async buildSkillVocab(): Promise<Map<string, number>> {
    // Try cache first
    try {
      const cached = await redisClient.get(SKILL_VOCAB_KEY);
      if (cached) {
        const entries: [string, number][] = JSON.parse(cached);
        VocabularyService.skillVocab = new Map(entries);
        return VocabularyService.skillVocab;
      }
    } catch {
      // Cache miss or error, rebuild
    }

    // Get skill frequency counts from users
    const users = await prisma.user.findMany({
      select: { skills: true },
    });

    const freq = new Map<string, number>();
    for (const user of users) {
      for (const skill of user.skills) {
        const normalized = skill.toLowerCase();
        freq.set(normalized, (freq.get(normalized) || 0) + 1);
      }
    }

    // Sort by frequency and take top N
    const sorted = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, SKILL_VOCAB_SIZE);

    const vocab = new Map<string, number>();
    sorted.forEach(([skill], index) => {
      vocab.set(skill, index);
    });

    // Cache for 24h
    try {
      await redisClient.setEx(
        SKILL_VOCAB_KEY,
        VOCAB_CACHE_TTL,
        JSON.stringify([...vocab.entries()])
      );
    } catch {
      // Non-fatal
    }

    VocabularyService.skillVocab = vocab;
    return vocab;
  }

  // Rebuild all vocabularies
  static async rebuildAll(): Promise<{
    hashtagVocab: Map<string, number>;
    skillVocab: Map<string, number>;
  }> {
    // Invalidate caches
    try {
      await redisClient.del(HASHTAG_VOCAB_KEY);
      await redisClient.del(SKILL_VOCAB_KEY);
    } catch {
      // Non-fatal
    }

    const [hashtagVocab, skillVocab] = await Promise.all([
      VocabularyService.buildHashtagVocab(),
      VocabularyService.buildSkillVocab(),
    ]);

    return { hashtagVocab, skillVocab };
  }

  static getHashtagVocab(): Map<string, number> | null {
    return VocabularyService.hashtagVocab;
  }

  static getSkillVocab(): Map<string, number> | null {
    return VocabularyService.skillVocab;
  }
}
