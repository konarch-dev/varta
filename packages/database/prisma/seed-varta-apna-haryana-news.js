const path = require('path');
const dotenv = require('dotenv');
const https = require('https');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const { prisma } = require(path.resolve(__dirname, '../dist/index.js'));

const API_KEY = 'pub_f6d491c00a0d49d699d15811ca828e31';

// Exact primary URL requested by the user
const PRIMARY_URL =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=Haryana&country=in&language=hi,en&category=breaking,domestic,crime,top,politics';

// Supplementary query if ever needed
const SUPPLEMENTARY_URL =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&q=haryana&country=in&language=hi,en&category=breaking,domestic,crime,top,politics';

const HARYANA_COMMENTS = [
  'दूध-दही का खाना, नंबर वन हरियाणा! खेल और किसानी में हमारा कोई सानी नहीं। 🚜🌾',
  'Olympic medals, boxing, wrestling championships, and sports culture make Haryana proud globally! 🤼‍♂️🏅',
  'साइबर सिटी गुरुग्राम और आधुनिक इंफ्रास्ट्रक्चर से युवाओं के लिए नए रोजगार पैदा हो रहे हैं। 🏢',
  'कुरुक्षेत्र की पावन धरा, गीता की भूमि और हरियाणवी संस्कृति हमारी असली धरोहर है। 🙏',
  'मंडियों में फसलों की सही एमएसपी और किसानों की भलाई सरकार की पहली प्राथमिकता होनी चाहिए। 🌾',
  'Authentic reporting and direct source link provided by Apna Haryana desk. Keep it up! 📰',
  'शिक्षा, तकनीक और स्वास्थ्य के क्षेत्र में प्रदेश का चहुंमुखी विकास सराहनीय है। 🌟',
  'रोड कनेक्टिविटी और एक्सप्रेसवे नेटवर्क से हरियाणा पूरे देश का लॉजिस्टिक्स हब बन रहा है। 🛣️',
];

function fetchJson(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaApnaHaryana/1.0 (Windows NT 10.0; Win64; x64)',
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
              resolve({});
            }
          });
        }
      )
      .on('error', () => resolve({}));
  });
}

async function fetchAllHaryanaArticles(targetCount = 45) {
  console.log('📡 Fetching live Haryana news from Newsdata.io API...');
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
  console.log('   • Calling primary user-specified URL (qInTitle=Haryana & language=hi,en)...');
  try {
    let nextToken = null;
    for (let p = 1; p <= 6; p++) {
      let u = PRIMARY_URL;
      if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
      const res = await fetchJson(u);
      if (res.results && res.results.length > 0) {
        console.log(`     ✅ Primary URL Page ${p} returned ${res.results.length} articles.`);
        addArticles(res.results);
        nextToken = res.nextPage;
        if (!nextToken || uniqueArticles.length >= targetCount) break;
      } else {
        break;
      }
    }
  } catch (e) {
    console.warn('     ⚠️ Primary URL fetch notice:', e.message);
  }

  // 2. Supplement if needed to reach targetCount
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing coverage (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 3; p++) {
        let u = SUPPLEMENTARY_URL;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchJson(u);
        if (res.results && res.results.length > 0) {
          console.log(`     ✅ Supplementary Page ${p} returned ${res.results.length} articles.`);
          addArticles(res.results);
          nextToken = res.nextPage;
          if (!nextToken || uniqueArticles.length >= targetCount) break;
        } else {
          break;
        }
      }
    } catch (err) {
      // continue
    }
  }

  console.log(`✅ Total unique Haryana news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatHaryanaPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #ApnaHaryana #Haryana #Chandigarh #Gurugram #Faridabad #IndiaTrends';
  const prefix = '🚜 HARYANA: ';
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
  console.log('🚀 SEEDING "VARTA | APNA HARYANA" WITH LIVESTREAM NEWSDATA API');
  console.log('================================================================\n');

  // 1. Fetch live articles from API
  const articles = await fetchAllHaryanaArticles(45);
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

  // 3. Upsert official desk user @apna_haryana
  console.log('👤 Ensuring official desk account "@apna_haryana" exists...');
  let haryanaUser = await prisma.user.findUnique({
    where: { username: 'apna_haryana' },
    include: { profile: true },
  });

  const haryanaUserData = {
    email: 'haryana@varta.in',
    username: 'apna_haryana',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const haryanaProfileData = {
    displayName: 'VARTA Apna Haryana 🌾🚜',
    bio: 'Official Haryana Desk of VARTA. दूध-दही का खाना, नंबर वन हरियाणा! Real-time updates from Chandigarh, Gurugram, Faridabad, Rohtak, sports champions, agriculture, and Haryanvi pride. #ApnaHaryana',
    avatarUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    location: 'Chandigarh / Gurugram, Haryana',
    website: 'https://newsdata.io',
  };

  if (!haryanaUser) {
    haryanaUser = await prisma.user.create({
      data: {
        ...haryanaUserData,
        profile: {
          create: haryanaProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@apna_haryana" user (ID: ${haryanaUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: haryanaUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: haryanaUser.id },
      update: haryanaProfileData,
      create: { ...haryanaProfileData, userId: haryanaUser.id },
    });
    console.log(`✅ Verified existing "@apna_haryana" user (ID: ${haryanaUser.id})`);
  }

  // 4. Find or create group "VARTA | Apna Haryana" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Apna Haryana" in "India Trends"...');
  const groupSlug = 'varta-apna-haryana';
  const groupData = {
    name: 'VARTA | Apna Haryana',
    slug: groupSlug,
    description:
      'दूध-दही का खाना, नंबर वन हरियाणा! The sports cradle of India producing Olympic medalists, Gurugram cyber hub, fertile agricultural belt, Haryanvi music beats, and warm community brotherhood.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
    creatorId: haryanaUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Apna Haryana" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Apna Haryana" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Apna Haryana...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === haryanaUser.id)) {
    memberCandidates.push(haryanaUser);
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
        role: m.id === haryanaUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Apna Haryana now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts from Newsdata API
  console.log(`\n📝 Inserting ${articles.length} live Haryana news posts from Newsdata API...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @apna_haryana, with occasional local reporters/citizens
    const author = idx % 2 === 0 ? haryanaUser : getRandomElement([haryanaUser, ...memberCandidates]);

    const postContent = formatHaryanaPostContent(
      article.title,
      article.description,
      article.source_name,
      article.link
    );

    // Stagger timestamps across recent days
    let postDate = article.pubDate ? new Date(article.pubDate) : new Date();
    if (isNaN(postDate.getTime())) {
      postDate = new Date(Date.now() - idx * 24 * 60 * 1000);
    }

    const likeCount = Math.floor(Math.random() * 110) + 40;
    const repostCount = Math.floor(Math.random() * 35) + 10;
    const bookmarkCount = Math.floor(Math.random() * 25) + 6;

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
    // Attach 1 to 2 comments on most posts
    const numComments = Math.random() < 0.85 ? (Math.random() < 0.4 ? 2 : 1) : 0;

    for (let c = 0; c < numComments; c++) {
      const commentText = getRandomElement(HARYANA_COMMENTS);

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
            likeCount: Math.floor(Math.random() * 25) + 4,
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
  console.log('🎉 "VARTA | APNA HARYANA" LIVE FEED SEEDING COMPLETE!');
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
