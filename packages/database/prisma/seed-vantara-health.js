const path = require('path');
const dotenv = require('dotenv');
const https = require('https');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const NEWSDATA_HEALTH_URL =
  'https://newsdata.io/api/1/latest?apikey=pub_f6d491c00a0d49d699d15811ca828e31&country=in&language=en,hi&category=health';

const HEALTH_COMMENTS_EN = [
  'Preventive healthcare and regular health screenings save lives. Excellent update! 🩺💪',
  'Nutrition and clean hydration are the foundation of true fitness. Great advice here!',
  'Thanks to Vantara Health Point for sharing verified health information with source links. Saved! 🌿',
  'Strength training combined with cardiovascular conditioning is the ultimate longevity recipe.',
  'Mental health and physical fitness go hand in hand. Loved this comprehensive perspective! ✨',
  'Immunity boosting habits and seasonal wellness tips are very practical for everyday living.',
  'Great medical breakthrough! Hope clinical trials expand access to affordable treatments.',
  'Consistency in daily steps, sleep quality, and balanced diet makes all the difference! 🏃‍♂️',
];

const HEALTH_COMMENTS_HI = [
  'स्वास्थ्य ही सबसे बड़ा धन है! सेहत और फिटनेस से जुड़ी बेहद उपयोगी और सटीक जानकारी 🩺🌿',
  'नियमित व्यायाम और संतुलित खान-पान अपनाकर कई बीमारियों से बचा जा सकता है। 💪',
  'वंतारा हेल्थ पॉइंट पर प्रमाणिक और समय पर स्वास्थ्य सलाह देने के लिए धन्यवाद!',
  'रोग प्रतिरोधक क्षमता (इम्युनिटी) मजबूत रखने के लिए यह उपाय बहुत कारगर हैं। अवश्य अपनाएं!',
  'दैनिक जीवन में योग, वॉक और पोषक आहार का संतुलन बनाए रखना बेहद आवश्यक है। 🏃‍♀️',
  'मानसिक शांति और शारीरिक तंदुरुस्ती दोनों के लिए यह रिपोर्ट बहुत मददगार है। 🌟',
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VantaraHealthPoint/1.0 (Windows NT 10.0; Win64; x64)',
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

async function fetchAllHealthArticles(maxPages = 5) {
  console.log(`📡 Fetching live health & fitness news from Newsdata.io (up to ${maxPages} pages)...`);
  const articles = [];
  let nextPageToken = null;

  for (let page = 1; page <= maxPages; page++) {
    let url = NEWSDATA_HEALTH_URL;
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

  console.log(`✅ Total unique health news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatHealthPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #VantaraHealth #FitnessAndHealth #Wellness #HealthTips #Nutrition';
  const prefix = '🩺 HEALTH: ';
  const sourcePart = sourceName ? ` [via ${sourceName}]` : '';
  const linkPart = link ? `\n🔗 ${link}` : '';

  const header = `${prefix}${title.trim()}${sourcePart}`;
  const footer = `${linkPart}${hashtags}`;

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
  console.log('🚀 SEEDING "VANTARA HEALTH POINT" IN FITNESS & HEALTH COMMUNITY');
  console.log('================================================================\n');

  // 1. Fetch live health news from Newsdata.io API
  const articles = await fetchAllHealthArticles(5);
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

  // 3. Upsert official health desk user @vantara_health
  console.log('👤 Ensuring official health desk account "@vantara_health" exists...');
  let healthUser = await prisma.user.findUnique({
    where: { username: 'vantara_health' },
    include: { profile: true },
  });

  const healthUserData = {
    email: 'health@vantara.in',
    username: 'vantara_health',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const healthProfileData = {
    displayName: 'Vantara Health Point 🩺',
    bio: 'Official Fitness & Health Desk of Vantara. Daily fitness motivation, nutrition science, preventive care, medical breakthroughs & holistic wellness across Bharat. #VantaraHealth',
    avatarUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
    location: 'Bengaluru / Hyderabad, India',
    website: 'https://newsdata.io',
  };

  if (!healthUser) {
    healthUser = await prisma.user.create({
      data: {
        ...healthUserData,
        profile: {
          create: healthProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@vantara_health" user (ID: ${healthUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: healthUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: healthUser.id },
      update: healthProfileData,
      create: { ...healthProfileData, userId: healthUser.id },
    });
    console.log(`✅ Verified existing "@vantara_health" user (ID: ${healthUser.id})`);
  }

  // 4. Create or update "Vantara Health Point" community under Fitness & Health
  console.log('\n🏛️ Creating or updating "Vantara Health Point" under "Fitness & Health"...');

  const groupSlug = 'vantara-health-point';
  const groupData = {
    name: 'Vantara Health Point',
    slug: groupSlug,
    description:
      'Official Fitness & Health community for Vantara. Discover daily workouts, nutrition science, mental wellness, medical breakthroughs, preventive healthcare, and holistic fitness across Bharat in Hindi & English.',
    category: 'Fitness & Health',
    avatarUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
    creatorId: healthUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "Vantara Health Point" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "Vantara Health Point" (ID: ${group.id})`);
  }

  // 5. Enroll members into Vantara Health Point Group
  console.log('\n👥 Enrolling community members into Vantara Health Point Group...');
  const memberCandidates = getRandomSubarray(users, Math.min(78, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === healthUser.id)) {
    memberCandidates.push(healthUser);
  }

  const memberRows = memberCandidates.map((u) => ({
    groupId: group.id,
    userId: u.id,
    role: u.id === healthUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
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
  console.log(`✅ Vantara Health Point now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing previous posts from this group for a clean sync...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} health & fitness posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @vantara_health, with occasional fitness coaches/doctors
    const author = idx % 3 === 0 ? healthUser : getRandomElement([healthUser, healthUser, ...memberCandidates]);

    const postContent = formatHealthPostContent(
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

    const likeCount = Math.floor(Math.random() * 95) + 30;
    const repostCount = Math.floor(Math.random() * 32) + 6;
    const bookmarkCount = Math.floor(Math.random() * 26) + 4;

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

  console.log(`✅ Successfully created ${createdPosts.length} health posts!`);
  console.log(`   - 🖼️ Posts with Image: ${imageCount}`);
  console.log(`   - 🎬 Posts with Video: ${videoCount}`);
  console.log(`   - 📄 Text-only Posts:  ${textOnlyCount}`);

  // 8. Generate community member discussion comments
  console.log('\n💬 Generating active community member comments on top health stories...');
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
        ? getRandomElement(HEALTH_COMMENTS_HI)
        : getRandomElement(HEALTH_COMMENTS_EN);

      const commentDate = new Date(
        new Date(parentPost.createdAt).getTime() + (cIdx + 1) * 7 * 60 * 1000
      );

      try {
        await prisma.post.create({
          data: {
            authorId: commenter.id,
            groupId: group.id,
            parentId: parentPost.id,
            content: commentText,
            likeCount: Math.floor(Math.random() * 18) + 2,
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

  console.log(`✅ Added ${totalComments} active comments & discussions to the health threads.`);

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
  console.log('🎉 "VANTARA HEALTH POINT" SETUP & DATA SYNC COMPLETE!');
  console.log('================================================================');
  console.log(`🏢 Group Name:     ${group.name}`);
  console.log(`🏷️ Category:       ${group.category}`);
  console.log(`🔗 Slug:           ${group.slug}`);
  console.log(`👥 Members:        ${enrolledMemberCount}`);
  console.log(`📰 Health Posts:   ${finalPostCount}`);
  console.log(`💬 Discussions:    ${totalComments}`);
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during Vantara Health Point seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
