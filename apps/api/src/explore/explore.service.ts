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
      const userQuery = cleanQuery.replace(/^[#@]+/, '').trim();
      const userConditions: any[] = [
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
      ];

      // If userQuery is different (e.g. query started with # or @)
      if (userQuery && userQuery !== cleanQuery) {
        userConditions.push(
          { username: { contains: userQuery, mode: 'insensitive' } },
          {
            profile: {
              displayName: { contains: userQuery, mode: 'insensitive' },
            },
          },
          {
            profile: {
              bio: { contains: userQuery, mode: 'insensitive' },
            },
          },
        );
      }

      const users = await this.prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          OR: userConditions,
        },
        take: limit,
        include: {
          profile: true,
          _count: { select: { followers: true } },
          followers: viewerId
            ? {
                where: { followerId: viewerId },
                select: { id: true },
              }
            : false,
        },
      });

      results.users = users.map((u: any) => ({
        id: u.id,
        username: u.username,
        displayName: u.profile?.displayName || u.username,
        bio: u.profile?.bio,
        avatarUrl: u.profile?.avatarUrl,
        isVerified: u.isVerified,
        isPrivate: u.isPrivate,
        followersCount: u._count?.followers || 0,
        isFollowing: viewerId ? (u.followers?.length > 0) : false,
      }));
    }

    // Search Posts
    if (type === 'all' || type === 'posts' || type === 'tags') {
      const normalizedTag = cleanQuery.replace(/^#/, '').trim().toLowerCase();
      const hashtagPrefix = `#${normalizedTag}`;

      const postConditions: any[] = [
        { content: { contains: cleanQuery, mode: 'insensitive' } },
      ];

      if (normalizedTag) {
        postConditions.push(
          { content: { contains: hashtagPrefix, mode: 'insensitive' } },
          {
            hashtags: {
              some: {
                hashtag: {
                  tag: { equals: normalizedTag, mode: 'insensitive' },
                },
              },
            },
          },
        );
      }

      const posts = await this.prisma.post.findMany({
        where: {
          deletedAt: null,
          author: { isPrivate: false },
          OR: postConditions,
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
      const normalizedTag = cleanQuery.replace(/^#/, '').trim().toLowerCase();
      let hashtags = await this.prisma.hashtag.findMany({
        where: {
          tag: { contains: normalizedTag, mode: 'insensitive' },
        },
        take: limit,
        orderBy: { usageCount: 'desc' },
      });

      // If no hashtag record was found in the Hashtag table, check if posts exist with #${normalizedTag}
      if (hashtags.length === 0 && normalizedTag) {
        const postCount = await this.prisma.post.count({
          where: {
            deletedAt: null,
            content: { contains: `#${normalizedTag}`, mode: 'insensitive' },
          },
        });

        if (postCount > 0) {
          const autoTag = await this.prisma.hashtag.upsert({
            where: { tag: normalizedTag },
            update: { usageCount: postCount },
            create: { tag: normalizedTag, usageCount: postCount },
          });
          hashtags = [autoTag];
        }
      }

      results.hashtags = hashtags.map((h) => ({
        id: h.id,
        tag: h.tag,
        usageCount: h.usageCount,
      }));
    }

    return results;
  }

  async getPostsByHashtag(tag: string, viewerId?: string, limit = 20) {
    const cleanTag = tag.replace(/^#/, '').trim().toLowerCase();
    const hashtag = await this.prisma.hashtag.findUnique({
      where: { tag: cleanTag },
    });

    if (!hashtag) {
      // Fallback: search posts containing this hashtag even if not in Hashtag table
      const rawPosts = await this.prisma.post.findMany({
        where: {
          deletedAt: null,
          author: { isPrivate: false },
          content: { contains: `#${cleanTag}`, mode: 'insensitive' },
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

      const formatted = await Promise.all(
        rawPosts.map((p) => this.postsService.formatPostResponse(p, viewerId)),
      );

      return {
        tag: cleanTag,
        usageCount: formatted.length,
        posts: formatted,
      };
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

    let activePosts = postHashtags
      .map((ph) => ph.post)
      .filter((p) => !p.deletedAt && !p.author.isPrivate);

    // If relation-based posts is empty, also fallback to content-based search
    if (activePosts.length === 0) {
      activePosts = await this.prisma.post.findMany({
        where: {
          deletedAt: null,
          author: { isPrivate: false },
          content: { contains: `#${cleanTag}`, mode: 'insensitive' },
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
    }

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

  async getCommunities(
    category?: string,
    search?: string,
    joinedOnly?: boolean,
    viewerId?: string,
    limit = 50,
    cursor?: string,
  ) {
    const where: any = {};

    if (category && category !== 'All' && category !== 'all' && category !== 'joined') {
      where.category = category;
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (joinedOnly && viewerId) {
      where.members = {
        some: { userId: viewerId },
      };
    }

    const groups = await (this.prisma as any).group.findMany({
      where,
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: [
        { memberCount: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        ...(viewerId && {
          members: {
            where: { userId: viewerId },
            select: { id: true },
          },
        }),
      },
    });

    const hasMore = groups.length > limit;
    const items = hasMore ? groups.slice(0, limit) : groups;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map((g: any) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        category: g.category,
        avatarUrl: g.avatarUrl,
        coverUrl: g.coverUrl,
        memberCount: g.memberCount,
        postCount: g.postCount,
        isJoined: viewerId ? (g.members?.length > 0) : false,
        createdAt: g.createdAt,
      })),
      nextCursor,
      hasMore,
    };
  }

  async toggleJoinCommunity(communityId: string, userId: string) {
    const existing = await (this.prisma as any).groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: communityId,
          userId,
        },
      },
    });

    if (existing) {
      await (this.prisma as any).groupMember.delete({
        where: { id: existing.id },
      });
      const updated = await (this.prisma as any).group.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } },
      });
      return { isJoined: false, memberCount: Math.max(0, updated.memberCount) };
    } else {
      await (this.prisma as any).groupMember.create({
        data: {
          groupId: communityId,
          userId,
          role: 'MEMBER',
        },
      });
      const updated = await (this.prisma as any).group.update({
        where: { id: communityId },
        data: { memberCount: { increment: 1 } },
      });
      return { isJoined: true, memberCount: updated.memberCount };
    }
  }

  async getCommunityPosts(communityId: string, limit = 20, cursor?: string, viewerId?: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        groupId: communityId,
        parentId: null,
        deletedAt: null,
      },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: { include: { profile: true } },
        media: true,
        poll: { include: { options: true } },
      },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const formattedItems = await Promise.all(
      items.map((p) => this.postsService.formatPostResponse(p, viewerId)),
    );

    return {
      items: formattedItems,
      nextCursor,
      hasMore,
    };
  }
}
