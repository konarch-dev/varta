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
  '&qInTitle=' +
  encodeURIComponent('naga land') +
  '&country=in&language=hi,en&category=breaking,domestic,crime,top,politics';

const PRIMARY_URL_NAGALAND =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&qInTitle=' +
  encodeURIComponent('Nagaland') +
  '&country=in&language=hi,en&category=breaking,domestic,crime,top,politics';

const PRIMARY_URL_QUERY =
  'https://newsdata.io/api/1/latest?apikey=' +
  API_KEY +
  '&q=' +
  encodeURIComponent('Nagaland') +
  '&country=in&language=hi,en&category=breaking,domestic,crime,top,politics';

// Google News live RSS fallback endpoints for Nagaland
const RSS_URLS = [
  'https://news.google.com/rss/search?q=Nagaland+Hornbill+Kohima+Dimapur+Kisama&hl=en-IN&gl=IN&ceid=IN:en',
  'https://news.google.com/rss/search?q=Nagaland+politics+governance+development&hl=en-IN&gl=IN&ceid=IN:en',
  'https://news.google.com/rss/search?q=' + encodeURIComponent('नागालैंड') + '&hl=hi&gl=IN&ceid=IN:hi',
];

const NAGALAND_STOCK_IMAGES = [
  'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&auto=format&fit=crop&q=80',
];

const NAGA_COMMENTS = [
  'The Land of Festivals! Hornbill Festival at Kisama Heritage Village is truly the pride of Northeast India. 🪶✨',
  'नागालैंड की समृद्ध जनजातीय संस्कृति, 16 जनजातियों की विरासत और हॉर्नबिल महोत्सव अद्भुत है! 🦅',
  'Preserving traditional Morungs, handloom shawls, and indigenous crafts is vital for future generations. 🧵',
  'Dzukou Valley trek and Kohima green hills offer the most breathtaking landscape in the entire country. 🌿⛰️',
  'इंफ्रास्ट्रक्चर विकास और दीमापुर-कोहिमा फोर-लेन कनेक्टिविटी से पर्यटन और व्यापार को बड़ा प्रोत्साहन मिला है। 🛣️',
  'Authentic reporting and source attribution from Naga Heritage desk. Proud of our Naga warrior roots! 📰',
  'मिथुन (Mithun) संरक्षण, जैविक खेती और स्थानीय हस्तशिल्प से ग्रामीण आजीविका को नई ताकत मिल रही है। 🌾',
  'Peace, unity among all Naga tribes, and sustainable tourism will take Nagaland to greater heights! 🌟🕊️',
];

function fetchHttps(url) {
  return new Promise((resolve) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'VartaNagaHeritage/1.0 (Windows NT 10.0; Win64; x64)',
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

function parseRssXml(xmlString) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xmlString)) !== null) {
    const itemStr = match[1];
    let title = (itemStr.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
    title = title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&').trim();

    let link = (itemStr.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    link = link.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();

    let pubDate = (itemStr.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    pubDate = pubDate.trim();

    let source = (itemStr.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';
    source = source.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();

    if (title && title.length > 5) {
      items.push({
        title,
        link,
        pubDate,
        source_name: source || 'Naga News Network',
        description: `Latest Nagaland updates regarding governance, culture, tourism, and community developments from ${source || 'regional sources'}.`,
        image_url: null,
      });
    }
  }
  return items;
}

async function fetchAllNagaArticles(targetCount = 46) {
  console.log('📡 Fetching live Nagaland news...');
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

  // 1. First attempt user-requested URL (qInTitle=naga land)
  console.log('   • Calling primary user-specified URL on Newsdata.io (qInTitle=naga land)...');
  try {
    const res = await fetchHttps(PRIMARY_URL);
    if (res.statusCode === 200) {
      const json = JSON.parse(res.body);
      if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
        console.log(`     ✅ Newsdata.io primary URL returned ${json.results.length} articles.`);
        addArticles(json.results);
      }
    }
  } catch (err) {
    console.warn('     ⚠️ Primary URL error:', err.message);
  }

  // 1b. Paginate through qInTitle=Nagaland on Newsdata.io
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Paginating through Newsdata.io qInTitle=Nagaland...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 5; p++) {
        let u = PRIMARY_URL_NAGALAND;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchHttps(u);
        if (res.statusCode === 200) {
          const json = JSON.parse(res.body);
          if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
            console.log(`     ✅ Newsdata.io (qInTitle=Nagaland) Page ${p} returned ${json.results.length} articles.`);
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
      // ignore
    }
  }

  // 1c. If still below targetCount, paginate through q=Nagaland on Newsdata.io
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Supplementing coverage with Newsdata.io q=Nagaland...`);
    try {
      let nextToken = null;
      for (let p = 1; p <= 3; p++) {
        let u = PRIMARY_URL_QUERY;
        if (nextToken) u += `&page=${encodeURIComponent(nextToken)}`;
        const res = await fetchHttps(u);
        if (res.statusCode === 200) {
          const json = JSON.parse(res.body);
          if (json.status === 'success' && Array.isArray(json.results) && json.results.length > 0) {
            console.log(`     ✅ Newsdata.io (q=Nagaland) Page ${p} returned ${json.results.length} articles.`);
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
      // ignore
    }
  }

  // 2. Resilient live RSS fallback (Google News IN Nagaland feeds)
  if (uniqueArticles.length < targetCount) {
    console.log(`   • Ingesting live Nagaland news feeds (currently ${uniqueArticles.length}/${targetCount} articles)...`);
    for (const rssUrl of RSS_URLS) {
      try {
        const res = await fetchHttps(rssUrl);
        if (res.statusCode === 200 && res.body) {
          const rssArticles = parseRssXml(res.body);
          console.log(`     ✅ Feed returned ${rssArticles.length} live articles.`);
          addArticles(rssArticles);
          if (uniqueArticles.length >= targetCount) break;
        }
      } catch (err) {
        // continue
      }
    }
  }

  console.log(`✅ Total unique Nagaland news articles collected: ${uniqueArticles.length}`);
  return uniqueArticles.slice(0, targetCount);
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray(arr, size) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function formatNagaPostContent(title, description, sourceName, link) {
  const MAX_CONTENT_LENGTH = 490; // Strictly within 500 varchar limit

  const hashtags = ' #NagaHeritage #Nagaland #HornbillFestival #Kohima #Dimapur #Kisama #IndiaTrends';
  const prefix = '🪶 NAGA HERITAGE: ';
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
  console.log('🚀 SEEDING "VARTA | NAGA HERITAGE" WITH LIVESTREAM NEWS FEED');
  console.log('================================================================\n');

  // 1. Fetch live articles
  const articles = await fetchAllNagaArticles(46);
  if (articles.length === 0) {
    console.error('❌ No articles retrieved! Check network connection.');
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

  // 3. Upsert official desk user @naga_heritage
  console.log('👤 Ensuring official desk account "@naga_heritage" exists...');
  let nagaUser = await prisma.user.findUnique({
    where: { username: 'naga_heritage' },
    include: { profile: true },
  });

  const nagaUserData = {
    email: 'nagaland@varta.in',
    username: 'naga_heritage',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$varta$hashmockpassword123456789',
    isVerified: true,
    role: 'USER',
    status: 'ACTIVE',
  };

  const nagaProfileData = {
    displayName: 'VARTA Naga Heritage 🪶🦅',
    bio: 'Official Nagaland Desk of VARTA. Land of Festivals! Real-time updates on Hornbill Festival, Kisama, Kohima, Dimapur, tribal traditions, Dzukou Valley, and Naga identity. #NagaHeritage',
    avatarUrl:
      'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    location: 'Kohima, Nagaland',
    website: 'https://newsdata.io',
  };

  if (!nagaUser) {
    nagaUser = await prisma.user.create({
      data: {
        ...nagaUserData,
        profile: {
          create: nagaProfileData,
        },
      },
      include: { profile: true },
    });
    console.log(`✅ Created official "@naga_heritage" user (ID: ${nagaUser.id})`);
  } else {
    await prisma.user.update({
      where: { id: nagaUser.id },
      data: { isVerified: true },
    });
    await prisma.userProfile.upsert({
      where: { userId: nagaUser.id },
      update: nagaProfileData,
      create: { ...nagaProfileData, userId: nagaUser.id },
    });
    console.log(`✅ Verified existing "@naga_heritage" user (ID: ${nagaUser.id})`);
  }

  // 4. Find or create group "VARTA | Naga Heritage" under "India Trends"
  console.log('\n🏛️ Finding group "VARTA | Naga Heritage" in "India Trends"...');
  const groupSlug = 'varta-naga-heritage';
  const groupData = {
    name: 'VARTA | Naga Heritage',
    slug: groupSlug,
    description:
      'The Land of Festivals! The world-famous Hornbill Festival in Kisama, trekking the emerald Dzukou Valley, traditional handwoven Naga shawls, 16 distinct warrior tribes, and Kohima bravery.',
    category: 'India Trends',
    avatarUrl:
      'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=800&auto=format&fit=crop&q=80',
    coverUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    creatorId: nagaUser.id,
    isPrivate: false,
  };

  let group = await prisma.group.findUnique({
    where: { slug: groupSlug },
  });

  if (!group) {
    group = await prisma.group.create({
      data: groupData,
    });
    console.log(`✅ Created "VARTA | Naga Heritage" (ID: ${group.id})`);
  } else {
    group = await prisma.group.update({
      where: { id: group.id },
      data: groupData,
    });
    console.log(`✅ Updated existing "VARTA | Naga Heritage" (ID: ${group.id})`);
  }

  // 5. Enroll members into the group
  console.log('\n👥 Enrolling community members into VARTA | Naga Heritage...');
  const memberCandidates = getRandomSubarray(users, Math.min(50, users.length));
  if (rakaUser && !memberCandidates.some((u) => u.id === rakaUser.id)) {
    memberCandidates.push(rakaUser);
  }
  if (!memberCandidates.some((u) => u.id === nagaUser.id)) {
    memberCandidates.push(nagaUser);
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
        role: m.id === nagaUser.id ? 'ADMIN' : Math.random() < 0.1 ? 'MODERATOR' : 'MEMBER',
      },
    });
  }

  const enrolledMemberCount = await prisma.groupMember.count({
    where: { groupId: group.id },
  });
  console.log(`✅ VARTA | Naga Heritage now has ${enrolledMemberCount} active members.`);

  // 6. Clean prior posts of this group for fresh synchronization
  console.log('\n🧹 Clearing prior posts from this group for clean synchronization...');
  await prisma.postMedia.deleteMany({
    where: { post: { groupId: group.id } },
  });
  await prisma.post.deleteMany({
    where: { groupId: group.id },
  });

  // 7. Insert posts
  console.log(`\n📝 Inserting ${articles.length} live Nagaland news posts...`);

  const createdPosts = [];
  let imageCount = 0;
  let videoCount = 0;
  let textOnlyCount = 0;

  for (let idx = 0; idx < articles.length; idx++) {
    const article = articles[idx];

    // Primary author is @naga_heritage, with occasional local reporters/citizens
    const author = idx % 2 === 0 ? nagaUser : getRandomElement([nagaUser, ...memberCandidates]);

    const postContent = formatNagaPostContent(
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

    // Attach media: whatever this API / feed provides, or curated high-res photo
    const mediaToCreate = [];

    const effectiveImageUrl =
      article.image_url && typeof article.image_url === 'string' && article.image_url.startsWith('http')
        ? article.image_url
        : NAGALAND_STOCK_IMAGES[idx % NAGALAND_STOCK_IMAGES.length];

    if (effectiveImageUrl) {
      mediaToCreate.push({
        type: 'IMAGE',
        url: effectiveImageUrl,
        thumbnailUrl: effectiveImageUrl,
        mimeType: 'image/jpeg',
        sizeBytes: 1200000,
        width: 1200,
        height: 800,
        order: 0,
        createdAt: postDate,
      });
      imageCount++;
    }

    // If video_url is present
    if (
      article.video_url &&
      typeof article.video_url === 'string' &&
      article.video_url.startsWith('http')
    ) {
      mediaToCreate.push({
        type: 'VIDEO',
        url: article.video_url,
        thumbnailUrl: effectiveImageUrl,
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
      const commentText = getRandomElement(NAGA_COMMENTS);

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
  console.log('🎉 "VARTA | NAGA HERITAGE" LIVE FEED SEEDING COMPLETE!');
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
