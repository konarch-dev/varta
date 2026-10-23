const path = require('path');
const dotenv = require('dotenv');
const https = require('https');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const API_KEY = process.env.NEWSDATA_API_KEY || 'pub_c072b1df5ced44fab6cfca876f39b4d0';

// Exact primary URL requested by the user
const PRIMARY_URL =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=punjab&country=in&language=pa&category=breaking,domestic,crime,top,politics';

// Supplementary URLs for full Punjabi news coverage
const SUPPLEMENTARY_URL_TITLE_PA =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=' +
  encodeURIComponent('ਪੰਜਾਬ') +
  '&country=in&language=pa&category=breaking,domestic,crime,top,politics';

const SUPPLEMENTARY_URL_QUERY =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&q=punjab&country=in&language=pa&category=breaking,domestic,crime,top,politics';

const PUNJAB_COMMENTS_PA = [
  'ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖ਼ਾਲਸਾ, ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫ਼ਤਹਿ! ਪੰਜਾਬ ਦੀ ਖ਼ੁਸ਼ਹਾਲੀ, ਅਮਨ ਅਤੇ ਸ਼ਾਂਤੀ ਲਈ ਅਰਦਾਸ ਕਰਦੇ ਹਾਂ। 🙏🌾',
  'ਕਿਸਾਨ ਵੀਰਾਂ ਦੀ ਅਣਥੱਕ ਮਿਹਨਤ ਅਤੇ ਖੇਤੀਬਾੜੀ ਖੇਤਰ ਵਿੱਚ ਸੁਧਾਰ ਪੰਜਾਬ ਦੀ ਆਰਥਿਕਤਾ ਦੀ ਰੀੜ੍ਹ ਦੀ ਹੱਡੀ ਹਨ। 🚜🌾',
  'ਪੰਜਾਬ ਦੇ ਨੌਜਵਾਨਾਂ ਲਈ ਸਥਾਨਕ ਰੁਜ਼ਗਾਰ ਦੇ ਨਵੇਂ ਮੌਕੇ, ਸਿੱਖਿਆ ਅਤੇ ਉਦਯੋਗਿਕ ਵਿਕਾਸ ਬਹੁਤ ਜ਼ਰੂਰੀ ਹੈ। 💼🏭',
  'ਸੱਚੀ, ਨਿਰਪੱਖ ਅਤੇ ਭਰੋਸੇਯੋਗ ਖ਼ਬਰ ਸਾਂਝੀ ਕਰਨ ਲਈ ਵਾਰਤਾ ਸੱਡਾ ਪੰਜਾਬ ਡੈਸਕ ਦਾ ਬਹੁਤ-ਬਹੁਤ ਧੰਨਵਾਦ! 📰⭐',
  'ਸਾਡਾ ਪੰਜਾਬ, ਸਾਡਾ ਅਮੀਰ ਵਿਰਸਾ ਅਤੇ ਮਿੱਠੀ ਪੰਜਾਬੀ ਬੋਲੀ ਸਾਡੀ ਅਸਲ ਪਛਾਣ ਹੈ। ਜਿਊਂਦਾ ਵਸਦਾ ਰਹੇ ਪੰਜਾਬ! 🌾🎶',
  'ਅੰਮ੍ਰਿਤਸਰ, ਜਲੰਧਰ, ਲੁਧਿਆਣਾ, ਬਠਿੰਡਾ ਅਤੇ ਮੋਹਾਲੀ ਵਿੱਚ ਵਿਕਾਸ ਕਾਰਜਾਂ ਵਿੱਚ ਹੋਰ ਤੇਜ਼ੀ ਆਉਣੀ ਚਾਹੀਦੀ ਹੈ। 🛣️🏙️',
  'ਸੂਬੇ ਵਿੱਚ ਅਮਨ-ਕਾਨੂੰਨ, ਨਿਆਂ ਅਤੇ ਨਾਗਰਿਕ ਸੁਰੱਖਿਆ ਨੂੰ ਹਮੇਸ਼ਾ ਪਹਿਲੀ ਤਰਜੀਹ ਮਿਲਣੀ ਚਾਹੀਦੀ ਹੈ। ⚖️🛡️',
  'ਸਿੱਖਿਆ, ਖੇਡਾਂ ਦੇ ਮੈਦਾਨ ਅਤੇ ਮਿਆਰੀ ਸਿਹਤ ਸਹੂਲਤਾਂ ਵੱਲ ਸਰਕਾਰ ਨੂੰ ਵਿਸ਼ੇਸ਼ ਧਿਆਨ ਦੇਣ ਦੀ ਲੋੜ ਹੈ। 🏅📚',
];

function fetchHttps(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaSaddaPunjab/1.0 (Windows NT 10.0; Win64; x64)',
            Accept: '*/*',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        }
      )
      .on('error', (err) => resolve({ statusCode: 500, body: '', error: err.message }));
  });
}

async function fetchAllPunjabArticles(targetCount = 47) {
  console.log('📡 Fetching live Punjab news in Punjabi from Newsdata.io API...');
  const uniqueArticles = [];
  const seenKeys = new Set();

  function addArticles(list) {
    if (!Array.isArray(list)) return;
    for (const a of list) {
      const key = a.article_id || a.title;
      if (key && !seenKeys.has(key) && a.title && a.title.trim().length > 3) {
        seenKeys.add(key);
        uniqueArticles.push(a);
      }
    }
  }

  // 1. Fetch from exact user-requested primary URL with pagination
  console.log('   • Calling primary user-specified URL (qInTitle=punjab & language=pa)...');
  try {
    let nextToken = null;
    for (let p = 1; p <= 6; p++) {
      let u = PRIMARY_URL;
      if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
      const res = await fetchHttps(u);
      if (res.statusCode === 200) {
        const json = JSON.parse(res.body);
        if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
          console.log(`     ✅ Primary URL Page ${p} returned ${json.results.length} articles.`);
          addArticles(json.results);
          nextToken = json.nextPage;
          if (!nextToken || uniqueArticles.length >= targetCount) break;
        } else {
          break;
        }
      } else {
        break;
      }
    }
  } catch (e) {
    console.warn('     ⚠️ Primary URL fetch notice:', e.message);
  }

  // 2. Fetch from qInTitle=ਪੰਜਾਬ if more articles needed
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing with qInTitle=ਪੰਜਾਬ (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      const res = await fetchHttps(SUPPLEMENTARY_URL_TITLE_PA);
      if (res.statusCode === 200) {
        const json = JSON.parse(res.body);
        if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
          console.log(`     ✅ qInTitle=ਪੰਜਾਬ returned ${json.results.length} articles.`);
          addArticles(json.results);
        }
      }
    } catch (err) {
      // continue
    }
  }

  // 3. Supplement if needed with q=punjab
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing coverage with q=punjab (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 3; p++) {
        let u = SUPPLEMENTARY_URL_QUERY;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchHttps(u);
        if (res.statusCode === 200) {
          const json = JSON.parse(res.body);
          if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
            console.log(`     ✅ q=punjab Page ${p} returned ${json.results.length} articles.`);
            addArticles(json.results);
            nextToken = json.nextPage;
            if (!nextToken || uniqueArticles.length >= targetCount) break;
          } else {
            break;
          }
        } else {
          break;
        }
      }
    } catch (err) {
      // continue
    }
  }

  console.log(`✅ Total unique Punjab Punjabi news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles.slice(0, targetCount);
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatPunjabPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #SaddaPunjab #Punjab #PunjabNews #Amritsar #Ludhiana #Chandigarh #IndiaTrends';
  const prefix = '🌾 ਸੱਡਾ ਪੰਜਾਬ: ';
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

  let finalContent = `${header}${descText}${footer}`;
  if (finalContent.length > MAX_CONTENT_LENGTH) {
    const overflow = finalContent.length - MAX_CONTENT_LENGTH;
    const truncatedTitle = title.trim().slice(0, Math.max(20, title.trim().length - overflow - 5)) + '...';
    finalContent = `${prefix}${truncatedTitle}${sourcePart}${descText}${footer}`;
  }

  return finalContent.slice(0, MAX_CONTENT_LENGTH);
}

async function main() {
  console.log('================================================================');
  console.log('🚀 SEEDING "VARTA | SADDA PUNJAB" WITH LIVESTREAM NEWSDATA API');
  console.log('================================================================\n');

  // 1. Fetch live articles from API
  const articles = await fetchAllPunjabArticles(47);
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
  const diljitUser = users.find((u) => u.username === 'diljit_dosanjh_punjab');

  // 3. Upsert official desk user @sadda_punjab
  console.log('👤 Ensuring official desk account "@sadda_punjab" exists...');
  let pbUser = await prisma.user.findUnique({
    where: { username: 'sadda_punjab' },
    include: { profile: true },
  });

  const pbUserData = {
    email: 'sadda_punjab@varta.in',
    username: 'sadda_punjab',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const pbProfileData = {
    displayName: 'VARTA Sadda Punjab 🌾🚜',
    bio: 'Official Punjab News & Culture Desk of VARTA. ਜੀ ਆਇਆਂ ਨੂੰ! Real-time updates from Amritsar, Ludhiana, Jalandhar, Bathinda, Mohali, agriculture, politics, music, and Punjabi diaspora. #SaddaPunjab',
    avatarUrl:
      'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
    location: 'Chandigarh / Amritsar, Punjab',
    website: 'https://newsdata.io',
  };

  if (!pbUser) {
    pbUser = await prisma.user.create({
      data: {
        ...pbUserData,
        profile: {
          create: pbProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@sadda_punjab" user (ID: ${pbUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: pbUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: pbUser.id },
      update: pbProfileData,
      create: { ...pbProfileData, userId: pbUser.id },
    });
    console.log(`✅ Verified existing "@sadda_punjab" user (ID: ${pbUser.id})`);
  }

  // 4. Find or update group "VARTA | Sadda Punjab" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Sadda Punjab" in "India Trends"...');
  const groupSlug = 'varta-sadda-punjab';
  const groupData = {
    name: 'VARTA | Sadda Punjab',
    slug: groupSlug,
    description:
      'ਜੀ ਆਇਆਂ ਨੂੰ! Land of Five Rivers. Golden Temple Amritsar, spirited Bhangra and Giddha, lush yellow Sarson fields, Makki di Roti with Sarson da Saag, and Punjabi music taking over the globe.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
    creatorId: pbUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findFirst({
    where: {
      OR: [
        { slug: groupSlug },
        { name: 'VARTA | Sadda Punjab' },
      ],
    },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Sadda Punjab" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Sadda Punjab" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Sadda Punjab...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (diljitUser && !memberCandidates.some((u) => u.id === diljitUser.id)) {
    memberCandidates.push(diljitUser);
  }
  if (!memberCandidates.some((u) => u.id === pbUser.id)) {
    memberCandidates.push(pbUser);
  }

  for (const m of memberCandidates) {
    await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: m.id,
        },
      },
      update: {},
      create: {
        groupId: group.id,
        userId: m.id,
        role: m.id === pbUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Sadda Punjab now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  const existingPosts = await prisma.post.findMany({
    where: { groupId: group.id },
    select: { id: true },
  });
  const existingPostIds = existingPosts.map((p) => p.id);

  if (existingPostIds.length > 0) {
    await prisma.postMedia.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.like.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.bookmark.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.repost.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.postHashtag.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.mention.deleteMany({ where: { postId: { in: existingPostIds } } });
    await prisma.post.deleteMany({ where: { id: { in: existingPostIds }, parentId: { not: null } } });
    await prisma.post.deleteMany({ where: { id: { in: existingPostIds } } });
  }

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} live Punjab news posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @sadda_punjab, with occasional local reporters/citizens
    const author = idx % 2 === 0 ? pbUser : getRandomElement([pbUser, diljitUser, ...memberCandidates].filter(Boolean));

    const postContent = formatPunjabPostContent(
      article.title,
      article.description,
      article.source_name,
      article.link
    );

    // Stagger timestamps across recent hours / days
    let postDate = article.pubDate ? new Date(article.pubDate) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 24 * 60 * 1000);
    }

    const likeCount = Math.floor(Math.random() * 125) + 38;
    const repostCount = Math.floor(Math.random() * 35) + 10;
    const bookmarkCount = Math.floor(Math.random() * 28) + 6;

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
      console.warn(`   ⚠️ Skipped post ${idx + 1} due to error:`, err.message);
    }
  }

  console.log(`✅ Successfully seeded ${createdPosts.length} posts!`);
  console.log(`   📸 Posts with image: ${imageCount}`);
  console.log(`   🎥 Posts with video: ${videoCount}`);
  console.log(`   📝 Text-only posts: ${textOnlyCount}`);

  // 8. Seed threaded discussion comments
  console.log('\n💬 Generating discussion comments...');
  let commentCount = 0;

  for (let i = 0; i < createdPosts.length; i++) {
    const parentPost = createdPosts[i];
    const numComments = Math.random() < 0.85 ? (Math.random() < 0.4 ? 2 : 1) : 0;

    for (let c = 0; c < numComments; c++) {
      const commentText = getRandomElement(PUNJAB_COMMENTS_PA);

      const commenter =
        getRandomElement(memberCandidates.filter((u) => u.id !== parentPost.authorId)) ||
        rakaUser ||
        users[0];

      const commentDate = new Date(parentPost.createdAt.getTime() + (c + 1) * 12 * 60 * 1000);

      try {
        await prisma.post.create({
          data: {
            authorId: commenter.id,
            parentId: parentPost.id,
            groupId: group.id,
            content: commentText,
            likeCount: Math.floor(Math.random() * 28) + 4,
            repostCount: 0,
            replyCount: 0,
            bookmarkCount: 0,
            createdAt: commentDate,
            updatedAt: commentDate,
          },
        });

        await prisma.post.update({
          where: { id: parentPost.id },
          data: {
            replyCount: {
              increment: 1,
            },
          },
        });

        commentCount++;
      } catch (err) {
        // Skip comment error
      }
    }
  }

  console.log(`✅ Seeded ${commentCount} threaded community comments.`);

  // 9. Update Group metrics
  const totalRootPosts = await prisma.post.count({
    where: { groupId: group.id, parentId: null },
  });

  await prisma.group.update({
    where: { id: group.id },
    data: {
      memberCount: enrolledMemberCount,
      postCount: totalRootPosts,
    },
  });

  console.log('\n======================================================');
  console.log('🎉 "VARTA | SADDA PUNJAB" LIVE FEED SEEDING COMPLETE!');
  console.log(`🏛️ Group: ${group.name} (${group.slug})`);
  console.log(`📂 Category: ${group.category}`);
  console.log(`👥 Members: ${enrolledMemberCount}`);
  console.log(`📝 Live News Posts: ${totalRootPosts}`);
  console.log(`💬 Threaded Comments: ${commentCount}`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
