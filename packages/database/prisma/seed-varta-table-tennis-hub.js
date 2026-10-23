const path = require('path');
const dotenv = require('dotenv');
const https = require('https');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const NEWS_API_URL =
  'https://newsapi.org/v2/everything?q=Table%20Tennis&apiKey=ea52290257e54a14a5b9afd0c7889da1';

const TABLE_TENNIS_VIDEOS = [
  {
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 15400000,
    width: 1280,
    height: 720,
  },
  {
    url: 'https://filesamples.com/samples/video/mp4/sample_960x540.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4200000,
    width: 960,
    height: 540,
  },
  {
    url: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511067007772-9da09bc2c679?w=800&auto=format&fit=crop&q=80',
    mimeType: 'video/mp4',
    sizeBytes: 4800000,
    width: 720,
    height: 480,
  },
];

const TABLE_TENNIS_DISCUSSIONS = [
  'The hand-eye coordination on that counter-smash from 15 feet behind the table was superhuman! 🏓🔥',
  'That heavy underspin push forced an unforced error at deuce. Brilliant defensive tactical play!',
  'The banana flick on the service return was unstoppable. Such high wrist flexibility!',
  'WTT Champions series has been delivering non-stop drama this week. The depth in world table tennis right now is insane 🏆',
  'Ultimate Table Tennis (UTT) in India has transformed the sport locally. Love seeing young paddlers taking on the world elite!',
  'Thanks for sharing the news article and source link! Keeping track of all ITTF rankings here 📰🏓',
  'Penhold reverse backhand vs shakehand grip loop rallies will always be the best spectacle in sports.',
  'The sidespin curl on that ball literally curved around the net post! Unreal shot making 🏓✨',
];

function fetchNewsApi(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'VartaTableTennisHub/1.0' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatPostContent(title, description, sourceName, sourceUrl) {
  const hashtags = ' #TableTennis #PingPong #VartaTableTennis #ITTF #WTT #Sports';
  const sourcePart = sourceUrl ? `\n\nSource: ${sourceUrl}` : '';
  const attribution = sourceName ? ` [via ${sourceName}]` : '';

  // Max length is 500 characters in PostgreSQL schema
  const MAX_CONTENT_LENGTH = 490;

  let text = `${title}${attribution}`;
  if (description && description.trim()) {
    text += `\n\n${description.trim()}`;
  }

  const combined = `${text}${sourcePart}${hashtags}`;
  if (combined.length <= MAX_CONTENT_LENGTH) {
    return combined;
  }

  // Truncate description or title if too long
  const availableLength =
    MAX_CONTENT_LENGTH - sourcePart.length - hashtags.length - attribution.length - 10;
  let truncatedText = title;
  if (description && description.trim()) {
    const remainingForDesc = availableLength - title.length - 4;
    if (remainingForDesc > 40) {
      truncatedText = `${title}\n\n${description.slice(0, remainingForDesc).trim()}...`;
    }
  } else if (title.length > availableLength) {
    truncatedText = `${title.slice(0, availableLength - 3).trim()}...`;
  }

  return `${truncatedText}${attribution}${sourcePart}${hashtags}`.slice(
    0,
    MAX_CONTENT_LENGTH
  );
}

async function main() {
  console.log('🏓 Starting VARTA Table Tennis Hub Group & NewsAPI Posts Seeding...\n');

  // 1. Fetch live articles from NewsAPI
  console.log('📡 Fetching table tennis news from NewsAPI...');
  let newsResponse;
  try {
    newsResponse = await fetchNewsApi(NEWS_API_URL);
  } catch (err) {
    console.error('❌ Failed to fetch from NewsAPI:', err.message);
    process.exit(1);
  }

  if (newsResponse.status !== 'ok' || !newsResponse.articles) {
    console.error('❌ NewsAPI returned invalid status:', newsResponse);
    process.exit(1);
  }

  const rawArticles = newsResponse.articles.filter(
    (a) => a.title && a.title !== '[Removed]' && a.title.trim().length > 5
  );
  console.log(
    `✅ Successfully retrieved ${rawArticles.length} valid table tennis news articles from NewsAPI.`
  );

  // 2. Fetch users from DB
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  });

  if (users.length === 0) {
    console.error('❌ No users found in database! Please run `npm run db:seed:users` first.');
    process.exit(1);
  }

  const rakaUser = users.find((u) => u.username === 'raka92');
  const adminUser = users.find((u) => u.username === 'varta_official') || users[0];

  // 3. Upsert "VARTA Table Tennis Hub" group
  console.log('🏟️ Creating or updating "VARTA Table Tennis Hub" community under Sports...');

  const groupSlug = 'varta-table-tennis-hub';
  let tableTennisGroup = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  const groupData = {
    name: 'VARTA Table Tennis Hub',
    slug: groupSlug,
    description:
      'The ultimate ping pong arena on VARTA! Follow ITTF World Championships, WTT tournaments, Ultimate Table Tennis (UTT), lightning-fast reflex rallies, equipment reviews, and spin mechanics.',
    category: 'Sports',
    avatarUrl:
      'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=1200&auto=format&fit=crop&q=80',
    creatorId: adminUser.id,
    isPrivate: false,
  };

  if (!tableTennisGroup) {
    tableTennisGroup = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA Table Tennis Hub" (ID: ${tableTennisGroup.id})`);
  } else {
    tableTennisGroup = await prisma.group.update({
      where: { id: tableTennisGroup.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA Table Tennis Hub" (ID: ${tableTennisGroup.id})`);
  }

  // 4. Enroll members into VARTA Table Tennis Hub
  console.log('👥 Enrolling members into VARTA Table Tennis Hub...');
  const memberCandidates = getRandomSubarray(users, Math.min(54, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === adminUser.id)) {
    memberCandidates.push(adminUser);
  }

  const memberRows = memberCandidates.map((u) => ({
    groupId: tableTennisGroup.id,
    userId: u.id,
    role: u.id === adminUser.id ? 'ADMIN' : Math.random() < 0.15 ? 'MODERATOR' : 'MEMBER',
  }));

  for (const m of memberRows) {
    await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: m.groupId,
          userId: m.userId,
        },
      },
      update: {},
      create: m,
    });
  }

  const totalMembers = await prisma.groupMember.count({
    where: { groupId: tableTennisGroup.id },
  });
  console.log(`✅ VARTA Table Tennis Hub now has ${totalMembers} joined members.`);

  // 5. Clean prior posts of this group if re-seeding
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: tableTennisGroup.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: tableTennisGroup.id },
  });

  // 6. Generate Posts from NewsAPI Articles
  console.log(`📝 Seeding ${rawArticles.length} NewsAPI table tennis posts with images, sources & video clips...`);

  const createdPosts = [];
  let videoPostCount = 0;
  let imagePostCount = 0;

  for (let idx = 0; idx < rawArticles.length; idx++) {
    const article = rawArticles[idx];
    const author = getRandomElement(memberCandidates);

    const postContent = formatPostContent(
      article.title,
      article.description,
      article.source?.name,
      article.url
    );

    // Stagger timestamp based on publishedAt
    let postDate = article.publishedAt ? new Date(article.publishedAt) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 3600000);
    }

    const likeCount = Math.floor(Math.random() * 85) + 15;
    const repostCount = Math.floor(Math.random() * 24) + 3;
    const bookmarkCount = Math.floor(Math.random() * 12) + 1;

    // Attach image or video
    const mediaToCreate = [];

    // Attach high-res article image if present
    if (article.urlToImage && article.urlToImage.startsWith('http')) {
      mediaToCreate.push({
        type: 'IMAGE',
        url: article.urlToImage,
        thumbnailUrl: article.urlToImage,
        mimeType: 'image/jpeg',
        sizeBytes: 1350000,
        width: 1200,
        height: 800,
        order: 0,
        createdAt: postDate,
      });
      imagePostCount++;
    }

    // Attach video highlights on select posts (~15% of posts)
    if (idx % 6 === 0) {
      const video = getRandomElement(TABLE_TENNIS_VIDEOS);
      mediaToCreate.push({
        type: 'VIDEO',
        url: video.url,
        thumbnailUrl: article.urlToImage || video.thumbnailUrl,
        mimeType: video.mimeType,
        sizeBytes: video.sizeBytes,
        width: video.width,
        height: video.height,
        order: mediaToCreate.length,
        createdAt: postDate,
      });
      videoPostCount++;
    }

    try {
      const post = await prisma.post.create({
        data: {
          authorId: author.id,
          groupId: tableTennisGroup.id,
          content: postContent,
          likeCount,
          repostCount,
          replyCount: 0,
          bookmarkCount,
          createdAt: postDate,
          updatedAt: postDate,
          ...(mediaToCreate.length > 0 && {
            media: {
              create: mediaToCreate,
            },
          }),
        },
      });

      createdPosts.push(post);
    } catch (err) {
      console.error(`Error creating post for article "${article.title.slice(0, 40)}":`, err.message);
    }
  }

  console.log(`✅ Created ${createdPosts.length} table tennis news posts!`);
  console.log(`   - 🖼️ Articles with high-res photos: ${imagePostCount}`);
  console.log(`   - 🎬 Articles with match video clips: ${videoPostCount}`);

  // 7. Generate active threaded member comments on the top news posts
  console.log('💬 Generating member discussions and comments on table tennis news...');
  let totalComments = 0;

  for (let i = 0; i < Math.min(createdPosts.length, 30); i++) {
    const parentPost = createdPosts[i];
    const commentsCount = Math.floor(Math.random() * 5) + 1;
    const commenters = getRandomSubarray(
      memberCandidates.filter((u) => u.id !== parentPost.authorId),
      commentsCount
    );

    for (let cIdx = 0; cIdx < commenters.length; cIdx++) {
      const commenter = commenters[cIdx];
      const commentText = getRandomElement(TABLE_TENNIS_DISCUSSIONS);
      const commentDate = new Date(
        new Date(parentPost.createdAt).getTime() + (cIdx + 1) * 12 * 60 * 1000
      );

      try {
        await prisma.post.create({
          data: {
            authorId: commenter.id,
            groupId: tableTennisGroup.id,
            parentId: parentPost.id,
            content: commentText,
            likeCount: Math.floor(Math.random() * 15) + 2,
            createdAt: commentDate,
            updatedAt: commentDate,
          },
        });
        totalComments++;
      } catch (err) {
        console.error('Error creating reply:', err.message);
      }
    }

    // Update parent reply count
    await prisma.post.update({
      where: { id: parentPost.id },
      data: { replyCount: commentsCount },
    }).catch(() => {});
  }

  // 8. Update final group counters
  const totalPostsInGroup = await prisma.post.count({
    where: { groupId: tableTennisGroup.id, parentId: null },
  });

  await prisma.group.update({
    where: { id: tableTennisGroup.id },
    data: {
      memberCount: totalMembers,
      postCount: totalPostsInGroup,
    },
  });

  console.log('\n======================================================');
  console.log('🏓 "VARTA TABLE TENNIS HUB" SEEDING COMPLETED!');
  console.log('======================================================');
  console.log(`🏢 Group Name:       ${tableTennisGroup.name}`);
  console.log(`🏷️ Category:         ${tableTennisGroup.category}`);
  console.log(`🔗 Slug:             ${tableTennisGroup.slug}`);
  console.log(`👥 Members:          ${totalMembers} members (including @raka92 & @varta_official)`);
  console.log(`📝 Top-Level Posts:  ${totalPostsInGroup} posts from NewsAPI`);
  console.log(`💬 Member Comments:  ${totalComments} discussions & match debates`);
  console.log(`🖼️ News Images:      ${imagePostCount} attached`);
  console.log(`🎬 Video Clips:      ${videoPostCount} attached`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during table tennis seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
