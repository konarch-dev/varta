const path = require('path');
const dotenv = require('dotenv');
const https = require('https');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const NEWSDATA_BASE_URL =
  'https://newsdata.io/api/1/latest?apikey=pub_f6d491c00a0d49d699d15811ca828e31&country=in&language=en,hi&category=breaking';

const NEWS_COMMENTS_EN = [
  'Critical update! Keeping a close eye on how this develops throughout the day.',
  'Thanks for the quick breaking coverage on Vantara Khabar. Great reporting!',
  'This is a major headline today across India. Very important development.',
  'Thanks for providing the direct source attribution and live link 📰',
  'Ground reality is moving quickly. Hope the official statements bring more clarity.',
  'Glad to see authentic breaking news right here in India Trends community! 🇮🇳',
  'Subscribed to notifications for this thread. Let us see the follow-up report.',
];

const NEWS_COMMENTS_HI = [
  'बहुत ही महत्वपूर्ण खबर! समय पर सटीक जानकारी देने के लिए धन्यवाद।',
  'देश भर में इस मुद्दे पर चर्चा तेज़ हो गई है। आगे के अपडेट्स का इंतज़ार रहेगा।',
  'वंतारा खबर पर लाइव अपडेट्स देखकर बहुत अच्छा लगा। निष्पक्ष और तेज़ रिपोर्टिंग! 🇮🇳',
  'इस मामले में प्रशासन की क्या प्रतिक्रिया आती है, यह देखना महत्वपूर्ण होगा।',
  'सटीक स्रोत और प्रमाणिक जानकारी के साथ बेहतरीन प्रस्तुति!',
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VantaraKhabar/1.0 (Windows NT 10.0; Win64; x64)',
            Accept: 'application/json',
          },
        },
        (res) => {
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
        }
      )
      .on('error', reject);
  });
}

async function fetchAllNewsArticles(maxPages = 5) {
  console.log(`📡 Fetching live breaking news from Newsdata.io (up to ${maxPages} pages)...`);
  const articles = [];
  let nextPageToken = null;

  for (let page = 1; page <= maxPages; page++) {
    let url = NEWSDATA_BASE_URL;
    if (nextPageToken) {
      url += `&page=${encodeURIComponent(nextPageToken)}`;
    }

    try {
      console.log(`   • Fetching page ${page}...`);
      const response = await fetchJson(url);

      if (response.status !== 'success' || !response.results) {
        console.warn(`   ⚠️ Warning: Page ${page} returned unexpected response:`, response.status);
        break;
      }

      console.log(`   ✅ Page ${page} returned ${response.results.length} articles.`);
      articles.push(...response.results);

      nextPageToken = response.nextPage;
      if (!nextPageToken) {
        console.log('   ℹ️ No further pages available.');
        break;
      }
    } catch (err) {
      console.error(`   ❌ Error fetching page ${page}:`, err.message);
      break;
    }
  }

  // Deduplicate articles by article_id or title
  const seen = new Set();
  const uniqueArticles = [];
  for (const a of articles) {
    const key = a.article_id || a.title;
    if (key && !seen.has(key) && a.title && a.title.trim().length > 3) {
      seen.add(key);
      uniqueArticles.push(a);
    }
  }

  console.log(`✅ Total unique breaking news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #VantaraKhabar #BreakingNews #IndiaTrends';
  const prefix = '🔴 BREAKING: ';
  const sourcePart = sourceName ? ` [via ${sourceName}]` : '';
  const linkPart = link ? `\n🔗 ${link}` : '';

  // Base format:
  // 🔴 BREAKING: {title} [via {source}]
  // {description}
  // 🔗 {link} #VantaraKhabar #BreakingNews #IndiaTrends

  const header = `${prefix}${title.trim()}${sourcePart}`;
  const footer = `${linkPart}${hashtags}`;

  // If header + footer already take space, fit as much description as possible
  const overhead = header.length + footer.length + 2;
  const remainingForDesc = MAX_CONTENT_LENGTH - overhead;

  let descText = '';
  if (description && description.trim() && remainingForDesc > 40) {
    descText = `\n\n${description.trim()}`;
    if (descText.length > remainingForDesc) {
      descText = `\n\n${description.trim().slice(0, remainingForDesc - 4)}...`;
    }
  }

  let fullText = `${header}${descText}${footer}`;

  // Fallback truncation if title itself was huge
  if (fullText.length > MAX_CONTENT_LENGTH) {
    const availTitleLen = MAX_CONTENT_LENGTH - prefix.length - sourcePart.length - footer.length - 5;
    if (availTitleLen > 10) {
      const truncatedTitle = `${title.slice(0, availTitleLen).trim()}...`;
      fullText = `${prefix}${truncatedTitle}${sourcePart}${footer}`;
    } else {
      fullText = fullText.slice(0, MAX_CONTENT_LENGTH);
    }
  }

  return fullText;
}

async function main() {
  console.log('================================================================');
  console.log('🚀 SEEDING "VANTARA KHABAR GROUP" IN INDIA TRENDS COMMUNITY');
  console.log('================================================================\n');

  // 1. Fetch live breaking news from Newsdata.io API
  const articles = await fetchAllNewsArticles(5);
  if (articles.length === 0) {
    console.error('❌ No articles retrieved from API! Check network connection or API status.');
    process.exit(1);
  }

  // 2. Fetch users from DB
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  });

  if (users.length === 0) {
    console.error('❌ No users found in database! Please run `npm run db:seed:users` first.');
    process.exit(1);
  }

  const rakaUser = users.find((u) => u.username === 'raka92');

  // 3. Upsert official news desk user @vantara_khabar
  console.log('👤 Ensuring official news desk account "@vantara_khabar" exists...');
  let newsUser = await prisma.user.findUnique({
    where: { username: 'vantara_khabar' },
    include: { profile: true },
  });

  const newsUserData = {
    email: 'khabar@vantara.in',
    username: 'vantara_khabar',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const newsProfileData = {
    displayName: 'Vantara Khabar 🇮🇳',
    bio: 'Official 24x7 Breaking News Desk of Vantara. Live updates, verified headlines & ground reports across India. #VantaraKhabar',
    avatarUrl:
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&auto=format&fit=crop&q=80',
    location: 'New Delhi, India',
    website: 'https://newsdata.io',
  };

  if (!newsUser) {
    newsUser = await prisma.user.create({
      data: {
        ...newsUserData,
        profile: {
          create: newsProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@vantara_khabar" user (ID: ${newsUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: newsUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: newsUser.id },
      update: newsProfileData,
      create: { ...newsProfileData, userId: newsUser.id },
    });
    console.log(`✅ Verified existing "@vantara_khabar" user (ID: ${newsUser.id})`);
  }

  // 4. Create or update "Vantara Khabar Group" community under India Trends
  console.log('\n🏛️ Creating or updating "Vantara Khabar Group" under "India Trends"...');

  const groupSlug = 'vantara-khabar-group';
  const groupData = {
    name: 'Vantara Khabar Group',
    slug: groupSlug,
    description:
      'Official India Trends news community for Vantara Khabar. Real-time breaking headlines, national developments, regional updates, and verified press coverage across Bharat in Hindi & English.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&auto=format&fit=crop&q=80',
    creatorId: newsUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "Vantara Khabar Group" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "Vantara Khabar Group" (ID: ${group.id})`);
  }

  // 5. Enroll members into Vantara Khabar Group
  console.log('\n👥 Enrolling community members into Vantara Khabar Group...');
  const memberCandidates = getRandomSubarray(users, Math.min(65, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === newsUser.id)) {
    memberCandidates.push(newsUser);
  }

  const memberRows = memberCandidates.map((u) => ({
    groupId: group.id,
    userId: u.id,
    role: u.id === newsUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
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

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ Vantara Khabar Group has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing previous posts from this group for a clean sync...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} breaking news posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @vantara_khabar news desk, with occasional correspondents
    const author = idx % 4 === 0 ? newsUser : getRandomElement([newsUser, newsUser, ...memberCandidates]);

    const postContent = formatPostContent(
      article.title,
      article.description,
      article.source_name,
      article.link
    );

    // Stagger timestamps across the last 24 hours
    let postDate = article.pubDate ? new Date(article.pubDate) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 22 * 60 * 1000);
    }

    const likeCount = Math.floor(Math.random() * 85) + 20;
    const repostCount = Math.floor(Math.random() * 30) + 5;
    const bookmarkCount = Math.floor(Math.random() * 15) + 2;

    // Attach media: whatever this API provides for each post (image and/or video)
    const mediaToCreate = [];

    // 1. If API provides image_url
    if (
      article.image_url &&
      typeof article.image_url === 'string' &&
      article.image_url.startsWith('http')
    ) {
      mediaToCreate.push({
        type: 'IMAGE',
        url: article.image_url,
        thumbnailUrl: article.image_url,
        mimeType: 'image/jpeg',
        sizeBytes: 1200000,
        width: 1200,
        height: 800,
        order: 0,
        createdAt: postDate,
      });
      imageCount++;
    }

    // 2. If API provides video_url
    if (
      article.video_url &&
      typeof article.video_url === 'string' &&
      article.video_url.startsWith('http')
    ) {
      mediaToCreate.push({
        type: 'VIDEO',
        url: article.video_url,
        thumbnailUrl: article.image_url || null,
        mimeType: 'video/mp4',
        sizeBytes: 8500000,
        width: 1280,
        height: 720,
        order: mediaToCreate.length,
        createdAt: postDate,
      });
      videoCount++;
    }

    if (mediaToCreate.length === 0) {
      textOnlyCount++;
    }

    try {
      const post = await prisma.post.create({
        data: {
          authorId: author.id,
          groupId: group.id,
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
      console.error(
        `   ❌ Error creating post for "${article.title.slice(0, 35)}...":`,
        err.message
      );
    }
  }

  console.log(`✅ Successfully created ${createdPosts.length} posts!`);
  console.log(`   - 🖼️ Posts with Image: ${imageCount}`);
  console.log(`   - 🎬 Posts with Video: ${videoCount}`);
  console.log(`   - 📄 Text-only Posts:  ${textOnlyCount}`);

  // 8. Generate community member discussion comments
  console.log('\n💬 Generating active community member comments on top breaking stories...');
  let totalComments = 0;

  for (let i = 0; i < Math.min(createdPosts.length, 25); i++) {
    const parentPost = createdPosts[i];
    const commentsCount = Math.floor(Math.random() * 4) + 1;
    const commenters = getRandomSubarray(
      memberCandidates.filter((u) => u.id !== parentPost.authorId),
      commentsCount
    );

    for (let cIdx = 0; cIdx < commenters.length; cIdx++) {
      const commenter = commenters[cIdx];
      const isHindi = Math.random() < 0.45;
      const commentText = isHindi
        ? getRandomElement(NEWS_COMMENTS_HI)
        : getRandomElement(NEWS_COMMENTS_EN);

      const commentDate = new Date(
        new Date(parentPost.createdAt).getTime() + (cIdx + 1) * 9 * 60 * 1000
      );

      try {
        await prisma.post.create({
          data: {
            authorId: commenter.id,
            groupId: group.id,
            parentId: parentPost.id,
            content: commentText,
            likeCount: Math.floor(Math.random() * 15) + 1,
            repostCount: 0,
            replyCount: 0,
            bookmarkCount: 0,
            createdAt: commentDate,
            updatedAt: commentDate,
          },
        });
        totalComments++;
      } catch (err) {
        console.error('Error creating comment:', err.message);
      }
    }

    // Update replyCount on the parent post
    await prisma.post.update({
      where: { id: parentPost.id },
      data: { replyCount: commentsCount },
    });
  }

  console.log(`✅ Added ${totalComments} active comments & discussions to the news threads.`);

  // 9. Update group memberCount and postCount
  const finalPostCount = await prisma.post.count({
    where: { groupId: group.id, parentId: null },
  });

  await prisma.group.update({
    where: { id: group.id },
    data: {
      memberCount: enrolledMemberCount,
      postCount: finalPostCount,
    },
  });

  console.log('\n================================================================');
  console.log('🎉 "VANTARA KHABAR GROUP" SETUP & DATA SYNC COMPLETE!');
  console.log('================================================================');
  console.log(`🏢 Group Name:     ${group.name}`);
  console.log(`🏷️ Category:       ${group.category}`);
  console.log(`🔗 Slug:           ${group.slug}`);
  console.log(`👥 Members:        ${enrolledMemberCount}`);
  console.log(`📰 Breaking Posts: ${finalPostCount}`);
  console.log(`💬 Discussions:    ${totalComments}`);
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during Vantara Khabar seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
