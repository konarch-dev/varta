import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import { PrismaClient, Role, AccountStatus, MediaType, NotificationType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting VARTA database seeding...');

  // Clean existing tables in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.moderationAction.deleteMany();
  await prisma.report.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.pollVote.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.postMedia.deleteMany();
  await prisma.postHashtag.deleteMany();
  await prisma.hashtag.deleteMany();
  await prisma.mention.deleteMany();
  await prisma.like.deleteMany();
  await prisma.repost.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.followRequest.deleteMany();
  await prisma.block.deleteMany();
  await prisma.mute.deleteMany();
  await prisma.post.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  const defaultPasswordHash = await argon2.hash('Varta@2026Secure!');

  // 1. Create Admin Account
  const admin = await prisma.user.create({
    data: {
      username: 'varta_official',
      email: 'admin@varta.in',
      passwordHash: defaultPasswordHash,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
      isVerified: true,
      profile: {
        create: {
          displayName: 'VARTA Official 🇮🇳',
          bio: 'Official handle of VARTA. Baat Sabki — The voice of modern India. Built for thinkers, creators & communities.',
          website: 'https://varta.in',
          location: 'New Delhi, India',
          avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
          coverUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80',
        },
      },
      notificationPref: {
        create: {},
      },
    },
  });

  // 2. Create Featured Indian Creator & Community Accounts
  const usersData = [
    {
      username: 'aarav_sharma',
      email: 'aarav@example.com',
      displayName: 'Aarav Sharma',
      bio: 'Fullstack Dev & Open Source enthusiast. Building for Bharat 🇮🇳. Bengaluru tech scene.',
      location: 'Bengaluru, Karnataka',
      website: 'https://aarav.dev',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
    },
    {
      username: 'priya_designs',
      email: 'priya@example.com',
      displayName: 'Priya Iyer',
      bio: 'Product Designer @ Mumbai. Minimalist aesthetics, typography, and Indian folk art revivals.',
      location: 'Mumbai, Maharashtra',
      website: 'https://priyadesigns.in',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
    },
    {
      username: 'rohit_cricket',
      email: 'rohit@example.com',
      displayName: 'Rohit Cricket Analytics',
      bio: 'Live cricket breakdowns, IPL stats, Ranji Trophy tracking. Cricket is not a game, it is emotion!',
      location: 'Chennai, Tamil Nadu',
      website: 'https://cricstats.in',
      isVerified: false,
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1000&auto=format&fit=crop&q=80',
    },
    {
      username: 'ananya_startup',
      email: 'ananya@example.com',
      displayName: 'Ananya Roy',
      bio: 'Venture Capitalist & Angel Investor in Indian deep-tech & D2C. Host of "Bharat Founders Podcast".',
      location: 'Gurugram, Haryana',
      website: 'https://ananyaventures.in',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
    },
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        username: u.username,
        email: u.email,
        passwordHash: defaultPasswordHash,
        role: Role.USER,
        status: AccountStatus.ACTIVE,
        isVerified: u.isVerified,
        profile: {
          create: {
            displayName: u.displayName,
            bio: u.bio,
            location: u.location,
            website: u.website,
            avatarUrl: u.avatarUrl,
            coverUrl: u.coverUrl,
          },
        },
        notificationPref: {
          create: {},
        },
      },
    });
    createdUsers.push(user);
  }

  console.log(`✅ Created ${createdUsers.length + 1} users (including admin).`);

  // 3. Create Follow Relationships
  await prisma.follow.createMany({
    data: [
      { followerId: createdUsers[0].id, followingId: admin.id },
      { followerId: createdUsers[1].id, followingId: admin.id },
      { followerId: createdUsers[2].id, followingId: admin.id },
      { followerId: createdUsers[3].id, followingId: admin.id },
      { followerId: createdUsers[0].id, followingId: createdUsers[1].id },
      { followerId: createdUsers[1].id, followingId: createdUsers[0].id },
      { followerId: createdUsers[2].id, followingId: createdUsers[0].id },
      { followerId: createdUsers[3].id, followingId: createdUsers[0].id },
    ],
  });

  // 4. Create Trending Indian Hashtags
  const hashtagsData = [
    { tag: 'baatsabki', usageCount: 1420 },
    { tag: 'techindia', usageCount: 890 },
    { tag: 'startups', usageCount: 654 },
    { tag: 'cricket', usageCount: 2310 },
    { tag: 'designinbharat', usageCount: 420 },
    { tag: 'chandrayaan', usageCount: 1100 },
  ];

  const hashtagMap = new Map<string, string>();
  for (const h of hashtagsData) {
    const created = await prisma.hashtag.create({
      data: h,
    });
    hashtagMap.set(h.tag, created.id);
  }

  // 5. Create Sample Seed Posts
  // Post 1: VARTA welcome
  const post1 = await prisma.post.create({
    data: {
      authorId: admin.id,
      content: 'Welcome to VARTA — Baat Sabki! 🇮🇳✨\n\nA platform built for independent discourse, creator freedom, and the voices that shape India. Share your thoughts, debate respectfully, and connect with minds across the nation.',
      likeCount: 42,
      repostCount: 18,
      hashtags: {
        create: [
          { hashtagId: hashtagMap.get('baatsabki')! },
          { hashtagId: hashtagMap.get('techindia')! },
        ],
      },
    },
  });

  // Post 2: Aarav Sharma tech post with Poll
  const post2 = await prisma.post.create({
    data: {
      authorId: createdUsers[0].id,
      content: 'What is your primary programming language for building high-scale web platforms in 2026? Vote below and share your stack! 👇 #TechIndia #Startups',
      likeCount: 28,
      replyCount: 12,
      repostCount: 7,
      hashtags: {
        create: [
          { hashtagId: hashtagMap.get('techindia')! },
          { hashtagId: hashtagMap.get('startups')! },
        ],
      },
      poll: {
        create: {
          question: 'Preferred backend language for production?',
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 3 days from now
          options: {
            create: [
              { text: 'TypeScript / Node / NestJS', voteCount: 48, order: 0 },
              { text: 'Go (Golang)', voteCount: 32, order: 1 },
              { text: 'Rust', voteCount: 19, order: 2 },
              { text: 'Python (FastAPI)', voteCount: 26, order: 3 },
            ],
          },
        },
      },
    },
  });

  // Post 3: Priya Design post with Media Image
  const post3 = await prisma.post.create({
    data: {
      authorId: createdUsers[1].id,
      content: 'Exploring dark-mode palette designs inspired by night skies over Jaipur. Contrast ratio 14.2:1 with electric blue highlights. How does this aesthetic feel? #DesignInBharat #BaatSabki',
      likeCount: 65,
      replyCount: 9,
      repostCount: 14,
      hashtags: {
        create: [
          { hashtagId: hashtagMap.get('designinbharat')! },
          { hashtagId: hashtagMap.get('baatsabki')! },
        ],
      },
      media: {
        create: [
          {
            type: MediaType.IMAGE,
            url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80',
            thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
            mimeType: 'image/jpeg',
            sizeBytes: 1240000,
            width: 1200,
            height: 800,
            order: 0,
          },
        ],
      },
    },
  });

  // Post 4: Rohit Cricket post
  const post4 = await prisma.post.create({
    data: {
      authorId: createdUsers[2].id,
      content: 'Incredible spell of fast bowling today! The seam position and late reverse swing at 145 km/h is sheer masterclass. Cricket season is officially here! 🏏🔥 #Cricket',
      likeCount: 94,
      replyCount: 22,
      repostCount: 31,
      hashtags: {
        create: [{ hashtagId: hashtagMap.get('cricket')! }],
      },
    },
  });

  // Post 5: Reply from Aarav to VARTA Official
  await prisma.post.create({
    data: {
      authorId: createdUsers[0].id,
      parentId: post1.id,
      content: 'Proud to see a homegrown, lightning-fast platform built with modern architecture. Congratulations team VARTA! 🚀',
      likeCount: 12,
    },
  });

  // Add initial likes
  await prisma.like.create({
    data: {
      userId: createdUsers[0].id,
      postId: post1.id,
    },
  });
  await prisma.like.create({
    data: {
      userId: createdUsers[1].id,
      postId: post1.id,
    },
  });
  await prisma.like.create({
    data: {
      userId: createdUsers[0].id,
      postId: post3.id,
    },
  });

  console.log('✅ Seeded initial posts, media, polls, hashtags, and social interactions.');
  console.log('🎉 VARTA database initialization completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
