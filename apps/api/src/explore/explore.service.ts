import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class ExploreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postsService: PostsService,
  ) {}

  async getTrending(limit = 10) {
    const hashtags = await this.prisma.hashtag.findMany({
      take: limit,
      orderBy: { usageCount: 'desc' },
    });

    return hashtags.map((h) => ({
      id: h.id,
      tag: h.tag,
      usageCount: h.usageCount,
    }));
  }

  async search(query: string, type = 'all', viewerId?: string, limit = 20) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      return { users: [], posts: [], hashtags: [] };
    }

    const results: any = { users: [], posts: [], hashtags: [] };

    // Search Users
    if (type === 'all' || type === 'users') {
      const users = await this.prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { username: { contains: cleanQuery, mode: 'insensitive' } },
            {
              profile: {
                displayName: { contains: cleanQuery, mode: 'insensitive' },
              },
            },
            {
              profile: {
                bio: { contains: cleanQuery, mode: 'insensitive' },
              },
            },
          ],
        },
        take: limit,
        include: { profile: true },
      });

      results.users = users.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.profile?.displayName || u.username,
        bio: u.profile?.bio,
        avatarUrl: u.profile?.avatarUrl,
        isVerified: u.isVerified,
      }));
    }

    // Search Posts
    if (type === 'all' || type === 'posts') {
      const posts = await this.prisma.post.findMany({
        where: {
          deletedAt: null,
          content: { contains: cleanQuery, mode: 'insensitive' },
          author: { isPrivate: false },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { include: { profile: true } },
          media: true,
          poll: { include: { options: true } },
          quotePost: {
            include: {
              author: { include: { profile: true } },
              media: true,
            },
          },
        },
      });

      results.posts = await Promise.all(
        posts.map((p) => this.postsService.formatPostResponse(p, viewerId)),
      );
    }

    // Search Hashtags
    if (type === 'all' || type === 'tags') {
      const normalizedTag = cleanQuery.replace(/^#/, '').toLowerCase();
      const hashtags = await this.prisma.hashtag.findMany({
        where: {
          tag: { contains: normalizedTag, mode: 'insensitive' },
        },
        take: limit,
        orderBy: { usageCount: 'desc' },
      });

      results.hashtags = hashtags.map((h) => ({
        id: h.id,
        tag: h.tag,
        usageCount: h.usageCount,
      }));
    }

    return results;
  }

  async getPostsByHashtag(tag: string, viewerId?: string, limit = 20) {
    const cleanTag = tag.replace(/^#/, '').toLowerCase();
    const hashtag = await this.prisma.hashtag.findUnique({
      where: { tag: cleanTag },
    });

    if (!hashtag) {
      return { tag: cleanTag, usageCount: 0, posts: [] };
    }

    const postHashtags = await this.prisma.postHashtag.findMany({
      where: { hashtagId: hashtag.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            author: { include: { profile: true } },
            media: true,
            poll: { include: { options: true } },
            quotePost: {
              include: {
                author: { include: { profile: true } },
                media: true,
              },
            },
          },
        },
      },
    });

    const activePosts = postHashtags
      .map((ph) => ph.post)
      .filter((p) => !p.deletedAt && !p.author.isPrivate);

    const formatted = await Promise.all(
      activePosts.map((p) => this.postsService.formatPostResponse(p, viewerId)),
    );

    return {
      tag: hashtag.tag,
      usageCount: hashtag.usageCount,
      posts: formatted,
    };
  }

  async getWhoToFollow(userId?: string, limit = 5) {
    const excludedIds = userId ? [userId] : [];

    if (userId) {
      const alreadyFollowing = await this.prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      excludedIds.push(...alreadyFollowing.map((f) => f.followingId));
    }

    const recommended = await this.prisma.user.findMany({
      where: {
        id: { notIn: excludedIds },
        status: 'ACTIVE',
      },
      take: limit,
      orderBy: [
        { isVerified: 'desc' },
        { followers: { _count: 'desc' } },
      ],
      include: {
        profile: true,
        _count: {
          select: { followers: true },
        },
      },
    });

    return recommended.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.profile?.displayName || u.username,
      bio: u.profile?.bio,
      avatarUrl: u.profile?.avatarUrl,
      isVerified: u.isVerified,
      followersCount: u._count.followers,
    }));
  }
}
