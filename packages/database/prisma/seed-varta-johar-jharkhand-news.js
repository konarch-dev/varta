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
  '&qInTitle=Jharkhand&country=in&language=hi,en&category=breaking,domestic,crime,top,politics';

// Supplementary query URL
const SUPPLEMENTARY_URL =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&q=jharkhand&country=in&language=hi,en&category=breaking,domestic,crime,top,politics';

const JHARKHAND_COMMENTS = [
  'जोहार झारखंड! भगवान बिरसा मुंडा की पावन धरती, सरहुल और करम पर्व की समृद्ध विरासत हमारी पहचान है। 🏹🌾',
  'रांची, जमशेदपुर और धनबाद के औद्योगिक एवं खेल विकास से युवाओं को नए अवसर मिल रहे हैं। 🏭🏏',
  'हुंडरू, जोन्हा फॉल्स और पारसनाथ शिखर का प्राकृतिक सौंदर्य झारखंड को पर्यटन का प्रमुख केंद्र बनाता है। 🏞️',
  'आदिवासी समाज के अधिकारों, जल-जंगल-ज़मीन के संरक्षण और स्थानीय संस्कृति का संवर्धन बेहद महत्वपूर्ण है। 🌿',
  'कानून-व्यवस्था और सुरक्षा प्रबंधन पर प्रशासन की सक्रियता सराहनीय है। ⚖️',
  'Authentic reporting and verified source link provided by Johar Jharkhand desk. Thank you! 📰',
  'झारखंड के खेल प्रतिभाओं और एमएस धोनी की विरासत से पूरे देश को गर्व है। 🏅',
  'शिक्षा, तकनीक और स्वास्थ्य के क्षेत्र में प्रदेश का चहुंमुखी विकास सराहनीय है। 🌟',
];

function fetchHttps(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaJoharJharkhand/1.0 (Windows NT 10.0; Win64; x64)',
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

async function fetchAllJharkhandArticles(targetCount = 46) {
  console.log('📡 Fetching live Jharkhand news from Newsdata.io API...');
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

  // 1. Fetch from exact user-requested primary URL across pages
  console.log('   • Calling primary user-specified URL (qInTitle=Jharkhand & language=hi,en)...');
  try {
    let nextToken = null;
    for (let p = 1; p <= 5; p++) {
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

  // 2. Supplement if needed with q=jharkhand to reach targetCount
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing coverage (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 3; p++) {
        let u = SUPPLEMENTARY_URL;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchHttps(u);
        if (res.statusCode === 200) {
          const json = JSON.parse(res.body);
          if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
            console.log(`     ✅ Supplementary Page ${p} returned ${json.results.length} articles.`);
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

  console.log(`✅ Total unique Jharkhand news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles.slice(0, targetCount);
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatJharkhandPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #JoharJharkhand #Jharkhand #Ranchi #Jamshedpur #Dhanbad #IndiaTrends';
  const prefix = '🏹 JHARKHAND: ';
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
  console.log('🚀 SEEDING "VARTA | JOHAR JHARKHAND" WITH LIVESTREAM NEWSDATA API');
  console.log('================================================================\n');

  // 1. Fetch live articles from API
  const articles = await fetchAllJharkhandArticles(46);
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

  // 3. Upsert official desk user @johar_jharkhand
  console.log('👤 Ensuring official desk account "@johar_jharkhand" exists...');
  let jharkhandUser = await prisma.user.findUnique({
    where: { username: 'johar_jharkhand' },
    include: { profile: true },
  });

  const jharkhandUserData = {
    email: 'jharkhand@varta.in',
    username: 'johar_jharkhand',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const jharkhandProfileData = {
    displayName: 'VARTA Johar Jharkhand 🏹🌿',
    bio: 'Official Jharkhand Desk of VARTA. जोहार झारखंड! Real-time updates from Ranchi, Jamshedpur, Dhanbad, Bokaro, mineral heritage, tribal festivals, and sports champions. #JoharJharkhand',
    avatarUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    location: 'Ranchi, Jharkhand',
    website: 'https://newsdata.io',
  };

  if (!jharkhandUser) {
    jharkhandUser = await prisma.user.create({
      data: {
        ...jharkhandUserData,
        profile: {
          create: jharkhandProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@johar_jharkhand" user (ID: ${jharkhandUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: jharkhandUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: jharkhandUser.id },
      update: jharkhandProfileData,
      create: { ...jharkhandProfileData, userId: jharkhandUser.id },
    });
    console.log(`✅ Verified existing "@johar_jharkhand" user (ID: ${jharkhandUser.id})`);
  }

  // 4. Find or create group "VARTA | Johar Jharkhand" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Johar Jharkhand" in "India Trends"...');
  const groupSlug = 'varta-johar-jharkhand';
  const groupData = {
    name: 'VARTA | Johar Jharkhand',
    slug: groupSlug,
    description:
      'जोहार झारखंड! Land of forests, waterfalls of Ranchi (Hundru, Jonha), Parasnath sacred peak, Sarhul flower festival, vibrant tribal music, steel city Jamshedpur, and cricket legend MS Dhoni.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    creatorId: jharkhandUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Johar Jharkhand" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Johar Jharkhand" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Johar Jharkhand...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === jharkhandUser.id)) {
    memberCandidates.push(jharkhandUser);
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
        role: m.id === jharkhandUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Johar Jharkhand now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} live Jharkhand news posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @johar_jharkhand, with occasional local reporters/citizens
    const author = idx % 2 === 0 ? jharkhandUser : getRandomElement([jharkhandUser, ...memberCandidates]);

    const postContent = formatJharkhandPostContent(
      article.title,
      article.description,
      article.source_name,
      article.link
    );

    // Stagger timestamps across recent days
    let postDate = article.pubDate ? new Date(article.pubDate) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 26 * 60 * 1000);
    }

    const likeCount = Math.floor(Math.random() * 115) + 38;
    const repostCount = Math.floor(Math.random() * 32) + 9;
    const bookmarkCount = Math.floor(Math.random() * 24) + 6;

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
      const commentText = getRandomElement(JHARKHAND_COMMENTS);

      const commenter =
        getRandomElement(memberCandidates.filter((u) => u.id !== parentPost.authorId)) ||
        rakaUser ||
        users[0];

      const commentDate = new Date(parentPost.createdAt.getTime() + (c + 1) * 15 * 60 * 1000);

      try {
        await prisma.post.create({
          data: {
            authorId: commenter.id,
            parentId: parentPost.id,
            groupId: group.id,
            content: commentText,
            likeCount: Math.floor(Math.random() * 26) + 4,
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
  console.log('🎉 "VARTA | JOHAR JHARKHAND" LIVE FEED SEEDING COMPLETE!');
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
