const path = require('path');
const dotenv = require('dotenv');
const https = require('https');
const crypto = require('crypto');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const NEWSDATA_FOOD_URL =
  'https://newsdata.io/api/1/latest?apikey=pub_f6d491c00a0d49d699d15811ca828e31&country=in&language=en,hi&category=food';

const FOOD_COMMENTS_EN = [
  'This looks absolutely delicious! Need to try making this recipe this weekend 🍲✨',
  'The aroma and spice blend in traditional Indian cooking are simply unmatched.',
  'Thanks to Vantara taste for sharing this authentic food story! Direct source link saved 🍛',
  'Gobindabhog and Basmati heritage grains represent the best of Indian culinary history.',
  'Street food culture in Bharat has so much diversity. Every region has its own signature flavor!',
  'The combination of slow-cooked spices and natural ingredients is sheer perfection.',
  'Food lovers across the country will appreciate this detailed spotlight. Mouthwatering!',
  'Adding this culinary spot to my food trail for the upcoming holidays!',
];

const FOOD_COMMENTS_HI = [
  'वाह! देखते ही मुंह में पानी आ गया। बेहद लजीज और स्वादिष्ट व्यंजन! 🍲😋',
  'भारतीय खान-पान और पारंपरिक मसालों का स्वाद दुनिया में सबसे अलग और खास है। 🇮🇳',
  'वंतारा टेस्ट पर क्षेत्रीय व्यंजनों और हेरिटेज खान-पान की बेहतरीन प्रस्तुति!',
  'इस पारंपरिक रेसिपी की खासियत इसकी खुशबू और शुद्ध मसालों में है। अवश्य आजमाएं! 🍽️',
  'खाने के शौकीनों के लिए यह एकदम लाजवाब पोस्ट है। आगे भी ऐसे स्वादिष्ट अपडेट्स लाते रहें!',
  'देसी स्वाद और घरेलू परंपराओं से जुड़ा यह व्यंजन दिल जीत लेने वाला है।',
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VantaraTaste/1.0 (Windows NT 10.0; Win64; x64)',
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

async function fetchAllFoodArticles(maxPages = 5) {
  console.log(`📡 Fetching live food & culinary news from Newsdata.io (up to ${maxPages} pages)...`);
  const articles = [];
  let nextPageToken = null;

  for (let page = 1; page <= maxPages; page++) {
    let url = NEWSDATA_FOOD_URL;
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

  console.log(`✅ Total unique food news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatFoodPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #VantaraTaste #Foodie #IndianFood #Recipes #FoodCulture';
  const prefix = '🍲 FOOD: ';
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
  console.log('🚀 SEEDING "VANTARA TASTE" IN FOOD COMMUNITY');
  console.log('================================================================\n');

  // 1. Fetch live food news from Newsdata.io API
  const articles = await fetchAllFoodArticles(5);
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

  // 3. Upsert official food desk user @vantara_taste
  console.log('👤 Ensuring official food desk account "@vantara_taste" exists...');
  let tasteUser = await prisma.user.findUnique({
    where: { username: 'vantara_taste' },
    include: { profile: true },
  });

  const tasteUserData = {
    email: 'taste@vantara.in',
    username: 'vantara_taste',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const tasteProfileData = {
    displayName: 'Vantara Taste 🍲',
    bio: 'Official Food & Culinary Desk of Vantara. Discover street foods, royal Awadhi banquets, coastal curries, secret family recipes & food culture across Bharat. #VantaraTaste',
    avatarUrl:
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&auto=format&fit=crop&q=80',
    location: 'Lucknow / Amritsar, India',
    website: 'https://newsdata.io',
  };

  if (!tasteUser) {
    tasteUser = await prisma.user.create({
      data: {
        ...tasteUserData,
        profile: {
          create: tasteProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@vantara_taste" user (ID: ${tasteUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: tasteUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: tasteUser.id },
      update: tasteProfileData,
      create: { ...tasteProfileData, userId: tasteUser.id },
    });
    console.log(`✅ Verified existing "@vantara_taste" user (ID: ${tasteUser.id})`);
  }

  // 4. Create or update "Vantara taste" community under Food
  console.log('\n🏛️ Creating or updating "Vantara taste" under "Food"...');

  const groupSlug = 'vantara-taste';
  const groupData = {
    name: 'Vantara taste',
    slug: groupSlug,
    description:
      'Official Food & Culinary community for Vantara. Discover street food treasures, authentic regional recipes, royal Awadhi banquets, spicy coastal curries, traditional mithai, and food culture across Bharat in Hindi & English.',
    category: 'Food',
    avatarUrl:
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&auto=format&fit=crop&q=80',
    creatorId: tasteUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "Vantara taste" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "Vantara taste" (ID: ${group.id})`);
  }

  // 5. Enroll members into Vantara taste Group
  console.log('\n👥 Enrolling community members into Vantara taste Group...');
  const memberCandidates = getRandomSubarray(users, Math.min(74, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === tasteUser.id)) {
    memberCandidates.push(tasteUser);
  }

  const memberRows = memberCandidates.map((u) => ({
    groupId: group.id,
    userId: u.id,
    role: u.id === tasteUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
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
  console.log(`✅ Vantara taste now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing previous posts from this group for a clean sync...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} food & culinary posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @vantara_taste, with occasional food bloggers/chefs
    const author = idx % 3 === 0 ? tasteUser : getRandomElement([tasteUser, tasteUser, ...memberCandidates]);

    const postContent = formatFoodPostContent(
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
    const repostCount = Math.floor(Math.random() * 30) + 6;
    const bookmarkCount = Math.floor(Math.random() * 25) + 5;

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

  console.log(`✅ Successfully created ${createdPosts.length} food posts!`);
  console.log(`   - 🖼️ Posts with Image: ${imageCount}`);
  console.log(`   - 🎬 Posts with Video: ${videoCount}`);
  console.log(`   - 📄 Text-only Posts:  ${textOnlyCount}`);

  // 8. Generate community member discussion comments
  console.log('\n💬 Generating active community member comments on top food stories...');
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
        ? getRandomElement(FOOD_COMMENTS_HI)
        : getRandomElement(FOOD_COMMENTS_EN);

      const commentDate = new Date(
        new Date(parentPost.createdAt).getTime() + (cIdx + 1) * 6 * 60 * 1000
      );

      try {
        await prisma.post.create({
          data: {
            authorId: commenter.id,
            groupId: group.id,
            parentId: parentPost.id,
            content: commentText,
            likeCount: Math.floor(Math.random() * 20) + 2,
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

  console.log(`✅ Added ${totalComments} active comments & discussions to the food threads.`);

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
  console.log('🎉 "VANTARA TASTE" SETUP & DATA SYNC COMPLETE!');
  console.log('================================================================');
  console.log(`🏢 Group Name:     ${group.name}`);
  console.log(`🏷️ Category:       ${group.category}`);
  console.log(`🔗 Slug:           ${group.slug}`);
  console.log(`👥 Members:        ${enrolledMemberCount}`);
  console.log(`📰 Food Posts:     ${finalPostCount}`);
  console.log(`💬 Discussions:    ${totalComments}`);
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Fatal error during Vantara taste seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
