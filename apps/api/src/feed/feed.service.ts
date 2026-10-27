import { Injectable } from '@nestjs/common';
import { Prisma } from '@varta/database';
import { PrismaService } from '../database/prisma.service';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postsService: PostsService,
  ) {}

  private async getExcludedUserIds(viewerId?: string): Promise<string[]> {
    if (!viewerId) return [];

    const [blockedByMe, blockedMe, mutedByMe] = await Promise.all([
      this.prisma.block.findMany({
        where: { blockerId: viewerId },
        select: { blockedId: true },
      }),
      this.prisma.block.findMany({
        where: { blockedId: viewerId },
        select: { blockerId: true },
      }),
      this.prisma.mute.findMany({
        where: { muterId: viewerId },
        select: { mutedId: true },
      }),
    ]);

    const excluded = new Set<string>();
    blockedByMe.forEach((b) => excluded.add(b.blockedId));
    blockedMe.forEach((b) => excluded.add(b.blockerId));
    mutedByMe.forEach((m) => excluded.add(m.mutedId));

    return Array.from(excluded);
  }

  async getFollowingFeed(userId: string, cursor?: string, limit = 20) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId); // Include own posts in following feed

    const excludedIds = await this.getExcludedUserIds(userId);
    const eligibleAuthorIds = followingIds.filter((id) => !excludedIds.includes(id));

    if (eligibleAuthorIds.length === 0) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    let offset = 0;
    if (cursor && /^\d+$/.test(cursor)) {
      offset = parseInt(cursor, 10);
    }

    // Twitter-style ranking for following feed:
    // Balances newest uploads with likes & comments engagement
    const scoredRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT p.id
      FROM "Post" p
      WHERE p."parentId" IS NULL
        AND p."deletedAt" IS NULL
        AND p."authorId" IN (${(Prisma as any).join(eligibleAuthorIds)})
      ORDER BY
        ROUND(
          CAST(
            ((p."likeCount" * 2.0 + p."replyCount" * 4.0 + p."repostCount" * 2.5 + 12.0) /
             POWER(EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600.0 + 1.5, 1.15))
            AS NUMERIC
          ), 4
        ) DESC,
        p."createdAt" DESC,
        p.id DESC
      LIMIT ${limit + 1} OFFSET ${offset}
    `;

    const hasMore = scoredRows.length > limit;
    const itemsRows = hasMore ? scoredRows.slice(0, limit) : scoredRows;
    const postIds = itemsRows.map((r) => r.id);

    if (postIds.length === 0) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const posts = await this.prisma.post.findMany({
      where: { id: { in: postIds } },
      include: {
        author: { include: { profile: true } },
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            avatarUrl: true,
          },
        },
        media: { orderBy: { order: 'asc' } },
        poll: { include: { options: { orderBy: { order: 'asc' } } } },
        quotePost: {
          include: {
            author: { include: { profile: true } },
            media: true,
          },
        },
      },
    });

    const postMap = new Map(posts.map((p) => [p.id, p]));
    const orderedPosts = postIds.map((id) => postMap.get(id)).filter(Boolean);

    const formatted = await Promise.all(
      orderedPosts.map((p) => this.postsService.formatPostResponse(p!, userId)),
    );

    const nextCursor = hasMore ? String(offset + limit) : null;

    return {
      items: formatted,
      nextCursor,
      hasMore,
    };
  }

  async getForYouFeed(
    viewerId?: string,
    cursor?: string,
    limit = 20,
    category?: string,
  ) {
    const excludedIds = await this.getExcludedUserIds(viewerId);

    // Filter out private accounts unless followed by viewer
    let allowedPrivateIds: string[] = [];
    if (viewerId) {
      const followed = await this.prisma.follow.findMany({
        where: { followerId: viewerId },
        select: { followingId: true },
      });
      allowedPrivateIds = followed.map((f) => f.followingId);
      allowedPrivateIds.push(viewerId);
    }

    let normalizedCategory: string | undefined;
    if (category && category.trim()) {
      const c = category.trim().toLowerCase();
      if (
        c === 'india-trends' ||
        c === 'india trends' ||
        c === 'indiatrends' ||
        c === 'india'
      ) {
        normalizedCategory = 'India Trends';
      } else if (c === 'tech' || c === 'technology') {
        normalizedCategory = 'Technology';
      } else if (c === 'travel') {
        normalizedCategory = 'Travel';
      } else if (c === 'food' || c === 'cuisine' || c === 'foods') {
        normalizedCategory = 'Food';
      } else if (c === 'lifestyle' || c === 'life style' || c === 'life-style') {
        normalizedCategory = 'Lifestyle';
      } else if (
        c === 'fitness & health' ||
        c === 'fitness-health' ||
        c === 'health' ||
        c === 'fitness' ||
        c === 'health & fitness'
      ) {
        normalizedCategory = 'Fitness & Health';
      } else if (c === 'sports' || c === 'sport') {
        normalizedCategory = 'Sports';
      } else if (c === 'entertainment') {
        normalizedCategory = 'Entertainment';
      } else {
        normalizedCategory = category.trim();
      }
    }

    let offset = 0;
    if (cursor && /^\d+$/.test(cursor)) {
      offset = parseInt(cursor, 10);
    }

    const conditions: any[] = [
      (Prisma as any).sql`p."parentId" IS NULL`,
      (Prisma as any).sql`p."deletedAt" IS NULL`,
    ];

    if (excludedIds.length > 0) {
      conditions.push((Prisma as any).sql`p."authorId" NOT IN (${(Prisma as any).join(excludedIds)})`);
    }

    if (allowedPrivateIds.length > 0) {
      conditions.push(
        (Prisma as any).sql`(u."isPrivate" = false OR p."authorId" IN (${(Prisma as any).join(allowedPrivateIds)}))`
      );
    } else {
      conditions.push((Prisma as any).sql`u."isPrivate" = false`);
    }

    if (normalizedCategory) {
      conditions.push(
        (Prisma as any).sql`(g.category ILIKE ${normalizedCategory} OR p.content ILIKE ${'%' + normalizedCategory + '%'})`
      );
    }

    const whereClause = (Prisma as any).sql`WHERE ${(Prisma as any).join(conditions, ' AND ')}`;

    // Twitter-style ranking score:
    // 1. Likes: 2.0x
    // 2. Comments/Replies: 4.0x (prioritizing active conversation and community debate)
    // 3. Reposts: 2.5x
    // 4. Newest uploads: recency boost base of 12.0 with gravity time decay ((ageInHours + 1.5) ^ 1.15)
    const scoredRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT p.id
      FROM "Post" p
      INNER JOIN "User" u ON p."authorId" = u.id
      LEFT JOIN "Group" g ON p."groupId" = g.id
      ${whereClause}
      ORDER BY
        ROUND(
          CAST(
            ((p."likeCount" * 2.0 + p."replyCount" * 4.0 + p."repostCount" * 2.5 + 12.0) /
             POWER(EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600.0 + 1.5, 1.15))
            AS NUMERIC
          ), 4
        ) DESC,
        p."createdAt" DESC,
        p.id DESC
      LIMIT ${limit + 1} OFFSET ${offset}
    `;

    const hasMore = scoredRows.length > limit;
    const itemsRows = hasMore ? scoredRows.slice(0, limit) : scoredRows;
    const postIds = itemsRows.map((r) => r.id);

    if (postIds.length === 0) {
      return {
        items: [],
        nextCursor: null,
        hasMore: false,
      };
    }

    const posts = await this.prisma.post.findMany({
      where: { id: { in: postIds } },
      include: {
        author: { include: { profile: true } },
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            avatarUrl: true,
          },
        },
        media: { orderBy: { order: 'asc' } },
        poll: { include: { options: { orderBy: { order: 'asc' } } } },
        quotePost: {
          include: {
            author: { include: { profile: true } },
            media: true,
          },
        },
      },
    });

    const postMap = new Map(posts.map((p) => [p.id, p]));
    const orderedPosts = postIds.map((id) => postMap.get(id)).filter(Boolean);

    const formatted = await Promise.all(
      orderedPosts.map((p) => this.postsService.formatPostResponse(p!, viewerId)),
    );

    const nextCursor = hasMore ? String(offset + limit) : null;

    return {
      items: formatted,
      nextCursor,
      hasMore,
    };
  }

  async getUserPosts(
    username: string,
    viewerId?: string,
    cursor?: string,
    limit = 20,
    tab = 'posts',
  ) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (!user) return { items: [], nextCursor: null, hasMore: false };

    const normalizedTab = (tab || 'posts').toLowerCase();

    // Check block status (bidirectional)
    if (viewerId && viewerId !== user.id) {
      const isBlocked = await this.prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: user.id, blockedId: viewerId },
            { blockerId: viewerId, blockedId: user.id },
          ],
        },
      });
      if (isBlocked) {
        return { items: [], nextCursor: null, hasMore: false };
      }
    }

    // Check account privacy
    if (user.isPrivate && viewerId !== user.id) {
      const isFollowing = viewerId
        ? await this.prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: viewerId,
                followingId: user.id,
              },
            },
          })
        : null;
      if (!isFollowing) {
        return { items: [], nextCursor: null, hasMore: false };
      }
    }

    const postInclude = {
      author: { include: { profile: true } },
      group: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          avatarUrl: true,
        },
      },
      media: { orderBy: { order: 'asc' as const } },
      poll: { include: { options: { orderBy: { order: 'asc' as const } } } },
      quotePost: {
        include: {
          author: { include: { profile: true } },
          media: true,
        },
      },
      parent: {
        include: {
          author: { include: { profile: true } },
        },
      },
    };

    // 1. BOOKMARKS TAB
    if (normalizedTab === 'bookmarks') {
      // Bookmarks are private to the user themselves
      if (!viewerId || viewerId !== user.id) {
        return { items: [], nextCursor: null, hasMore: false, isPrivate: true };
      }
      return this.getBookmarks(user.id, cursor, limit);
    }

    // 2. LIKES TAB
    if (normalizedTab === 'likes') {
      const likes = await this.prisma.like.findMany({
        where: {
          userId: user.id,
          post: {
            deletedAt: null,
          },
        },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: postInclude,
          },
        },
      });

      const hasMore = likes.length > limit;
      const items = hasMore ? likes.slice(0, limit) : likes;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      const formatted = await Promise.all(
        items
          .filter((l) => l.post && !l.post.deletedAt)
          .map((l) => this.postsService.formatPostResponse(l.post, viewerId)),
      );

      return {
        items: formatted,
        nextCursor,
        hasMore,
      };
    }

    // 3. POSTS, REPLIES, MEDIA TABS
    let whereCondition: Prisma.PostWhereInput = {
      authorId: user.id,
      deletedAt: null,
    };

    if (normalizedTab === 'media') {
      whereCondition = {
        ...whereCondition,
        media: { some: {} },
      };
    } else if (normalizedTab === 'replies') {
      whereCondition = {
        ...whereCondition,
        parentId: { not: null },
      };
    } else {
      // Default 'posts': original posts & quotes (excluding replies)
      whereCondition = {
        ...whereCondition,
        parentId: null,
      };
    }

    const posts = await this.prisma.post.findMany({
      where: whereCondition,
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: postInclude,
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const formatted = await Promise.all(
      items.map((p) => this.postsService.formatPostResponse(p, viewerId)),
    );

    return {
      items: formatted,
      nextCursor,
      hasMore,
    };
  }

  async getBookmarks(userId: string, cursor?: string, limit = 20) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            author: { include: { profile: true } },
            group: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
                avatarUrl: true,
              },
            },
            media: { orderBy: { order: 'asc' } },
            poll: { include: { options: true } },
            quotePost: {
              include: {
                author: { include: { profile: true } },
                media: true,
              },
            },
            parent: {
              include: {
                author: { include: { profile: true } },
              },
            },
          },
        },
      },
    });

    const hasMore = bookmarks.length > limit;
    const items = hasMore ? bookmarks.slice(0, limit) : bookmarks;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const formatted = await Promise.all(
      items
        .filter((b) => b.post && !b.post.deletedAt)
        .map((b) => this.postsService.formatPostResponse(b.post, userId)),
    );

    return {
      items: formatted,
      nextCursor,
      hasMore,
    };
  }
}
