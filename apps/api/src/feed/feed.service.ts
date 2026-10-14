import { Injectable } from '@nestjs/common';
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

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: { in: eligibleAuthorIds },
        parentId: null, // Top-level posts
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

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const formatted = await Promise.all(
      items.map((p) => this.postsService.formatPostResponse(p, userId)),
    );

    return {
      items: formatted,
      nextCursor,
      hasMore,
    };
  }

  async getForYouFeed(viewerId?: string, cursor?: string, limit = 20) {
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

    const posts = await this.prisma.post.findMany({
      where: {
        parentId: null,
        deletedAt: null,
        authorId: { notIn: excludedIds },
        OR: [
          { author: { isPrivate: false } },
          { authorId: { in: allowedPrivateIds } },
        ],
      },
      take: limit * 2, // Sample a larger batch to rank
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: { include: { profile: true } },
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

    // Calculate score for transparent ranking
    const now = Date.now();
    const scoredPosts = posts.map((post) => {
      const ageInHours = (now - post.createdAt.getTime()) / (1000 * 60 * 60);
      const engagement =
        post.likeCount * 1.0 +
        post.replyCount * 1.5 +
        post.repostCount * 2.0 +
        post.quoteCount * 1.5 +
        post.bookmarkCount * 1.2;
      const decay = Math.pow(ageInHours + 2, 1.4);
      const score = (engagement + 5) / decay;
      return { post, score };
    });

    scoredPosts.sort((a, b) => b.score - a.score);

    const hasMore = scoredPosts.length > limit;
    const selected = hasMore ? scoredPosts.slice(0, limit) : scoredPosts;
    const nextCursor = hasMore ? selected[selected.length - 1].post.id : null;

    const formatted = await Promise.all(
      selected.map(({ post }) => this.postsService.formatPostResponse(post, viewerId)),
    );

    return {
      items: formatted,
      nextCursor,
      hasMore,
    };
  }

  async getUserPosts(username: string, viewerId?: string, cursor?: string, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (!user) return { items: [], nextCursor: null, hasMore: false };

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: user.id,
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

    const hasMore = bookmarks.length > limit;
    const items = hasMore ? bookmarks.slice(0, limit) : bookmarks;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const formatted = await Promise.all(
      items
        .filter((b) => !b.post.deletedAt)
        .map((b) => this.postsService.formatPostResponse(b.post, userId)),
    );

    return {
      items: formatted,
      nextCursor,
      hasMore,
    };
  }
}
